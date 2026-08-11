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

const REGEX_TOTAL = /([\d.,]{4,})\s*(?:suscripciones|subscripciones)/i;
const REGEX_VARIACION = /variaci[oó]n[^%+\-\d]{0,30}([+-]?[\d.,]+)\s*%/i;
const REGEX_RENAULT = /Renault[^%\d]{0,60}([\d.,]+)\s*%/i;

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

    res.status(200).json({
      ok: true,
      datos: {
        totalSuscripciones: numeroDesdeTexto(totalMatch[1]),
        variacionMensual: numeroDesdeTexto(variacionMatch[1]),
        cuotaRenault: numeroDesdeTexto(renaultMatch[1]),
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
