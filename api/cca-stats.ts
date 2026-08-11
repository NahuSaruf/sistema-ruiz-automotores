// Función serverless de Vercel (no corre en el navegador): abre cca.com.ar/estadisticas/
// con un Chromium headless para que su JavaScript termine de renderizar las cifras, y
// las lee del texto ya pintado. Esto evita el problema de CORS (acá no aplica, es
// servidor-a-servidor) y el de que el HTML crudo no trae los números (sí los trae el
// DOM ya renderizado). Es igualmente frágil a que CCA cambie el diseño de la página:
// si no encuentra los 3 valores esperados, devuelve un error explícito en vez de inventarlos.
//
// `page.evaluate` corre el callback dentro del navegador headless, no en este proceso
// Node — por eso necesita los tipos de DOM sólo para esa expresión.
/// <reference lib="dom" />
import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  maxDuration: 30,
};

const CCA_URL = 'https://cca.com.ar/estadisticas/';

// Patrones verificados contra el texto real renderizado por cca.com.ar (relevado con
// el modo debug de este mismo endpoint el 11/08/2026). La página muestra:
//   TOTAL SUSCRIPCIONES\n184.881          -> total del período
//   VARIACIÓN MENSUAL\n↑ 12,2 %           -> variación, con flecha (no signo +/-) indicando dirección
//   RENAULT\n22.448                       -> conteo de suscripciones de Renault (no un %)
// No hay una cuota de mercado (%) explícita por marca: se calcula como
// suscripcionesRenault / totalSuscripciones.
const REGEX_TOTAL = /TOTAL SUSCRIPCIONES\s*\n?\s*([\d.,]+)/i;
const REGEX_VARIACION = /VARIACI[OÓ]N MENSUAL[\s\S]{0,20}?(↑|↓)\s*([\d.,]+)\s*%/i;
const REGEX_RENAULT = /RENAULT\s*\n?\s*([\d.,]+)/i;

const numeroDesdeTexto = (texto: string): number =>
  Number(texto.replace(/\./g, '').replace(',', '.'));

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Método no permitido.' });
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1600 });
    await page.goto(CCA_URL, { waitUntil: 'networkidle2', timeout: 20000 });
    // Margen extra para que el dashboard de CCA termine de pintar los números vía JS
    // después del evento de red inactiva.
    await esperar(2500);

    const texto = await page.evaluate(() => document.body.innerText);

    // Modo debug (?debug=1): devuelve el texto renderizado crudo. Se deja disponible
    // a propósito (no expone nada sensible, es una página pública) para poder re-ajustar
    // las regex de arriba rápido el día que CCA cambie el diseño de la página.
    if (req.query.debug === '1') {
      res.status(200).json({ ok: true, debug: true, texto });
      return;
    }

    // Modo debug de pestañas (?debug=tabs): la página tiene sub-pestañas (Suscripciones,
    // FC, Conversión, Mercado Total) que cambian el contenido sin recargar. Este modo
    // hace clic en cada una y devuelve el texto resultante, para poder diseñar la
    // extracción real de cada pestaña con contenido verdadero en vez de adivinar.
    if (req.query.debug === 'tabs') {
      const nombresPestanas = ['Suscripciones', 'FC', 'Conversión', 'Mercado Total'];
      const resultado: Record<string, string> = {};
      for (const nombre of nombresPestanas) {
        const clickeado = await page.evaluate((texto) => {
          const candidatos = Array.from(document.querySelectorAll('button, a, [role="tab"], li, div, span'));
          const el = candidatos.find((e) => e.textContent?.trim() === texto);
          if (el instanceof HTMLElement) {
            el.click();
            return true;
          }
          return false;
        }, nombre);
        await esperar(1500);
        resultado[nombre] = clickeado
          ? await page.evaluate(() => document.body.innerText)
          : '(no se encontró un elemento clickeable con ese texto)';
      }
      res.status(200).json({ ok: true, debug: 'tabs', resultado });
      return;
    }

    const totalMatch = texto.match(REGEX_TOTAL);
    const variacionMatch = texto.match(REGEX_VARIACION);
    const renaultMatch = texto.match(REGEX_RENAULT);

    if (!totalMatch || !variacionMatch || !renaultMatch) {
      res.status(502).json({
        ok: false,
        error: 'Se renderizó cca.com.ar pero no se encontraron los 3 valores esperados (el sitio puede haber cambiado de diseño).',
      });
      return;
    }

    const totalSuscripciones = numeroDesdeTexto(totalMatch[1]);
    const signoVariacion = variacionMatch[1] === '↓' ? -1 : 1;
    const variacionMensual = signoVariacion * numeroDesdeTexto(variacionMatch[2]);
    const renaultSuscripciones = numeroDesdeTexto(renaultMatch[1]);
    const cuotaRenault = totalSuscripciones > 0 ? (renaultSuscripciones / totalSuscripciones) * 100 : 0;

    res.status(200).json({
      ok: true,
      datos: {
        totalSuscripciones,
        variacionMensual,
        cuotaRenault,
        fechaSincronizacion: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: `No se pudo renderizar cca.com.ar del lado del servidor: ${err instanceof Error ? err.message : 'error desconocido'}.`,
    });
  } finally {
    if (browser) await browser.close();
  }
}
