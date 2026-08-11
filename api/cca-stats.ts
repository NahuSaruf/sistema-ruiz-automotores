// Función serverless de Vercel (no corre en el navegador): abre cca.com.ar/estadisticas/
// con un Chromium headless para que su JavaScript termine de renderizar las cifras, y
// las lee del texto ya pintado. Esto evita el problema de CORS (acá no aplica, es
// servidor-a-servidor) y el de que el HTML crudo no trae los números (sí los trae el
// DOM ya renderizado). Es igualmente frágil a que CCA cambie el diseño de la página:
// si no encuentra los valores esperados, devuelve un error explícito en vez de inventarlos.
//
// La página tiene 4 sub-pestañas que cambian el contenido sin recargar (Suscripciones,
// FC, Conversión, Mercado Total). Recorremos las primeras 3 haciendo clic (misma sesión
// de Chromium, sin relanzar el navegador) y derivamos "Mercado Total" combinando esos
// 3 totales, porque su pestaña sólo repite esos mismos 3 números ya vistos (verificado
// con el modo debug de este mismo endpoint el 11/08/2026).
//
// `page.evaluate` corre el callback dentro del navegador headless, no en este proceso
// Node — por eso necesita los tipos de DOM sólo para esas expresiones.
/// <reference lib="dom" />
import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium';
import puppeteer, { Page } from 'puppeteer-core';

export const config = {
  maxDuration: 30,
};

const CCA_URL = 'https://cca.com.ar/estadisticas/';

const numeroDesdeTexto = (texto: string): number =>
  Number(texto.replace(/\./g, '').replace(',', '.'));

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ItemRanking {
  marca: string;
  valor: number;
}

interface MetricaTab {
  total: number;
  marcaLider: string;
  variacionMensual: number;
  promedioMensual: number | null;
  renault: number | null;
  ranking: ItemRanking[];
}

// Marcas que aparecen listadas en cca.com.ar/estadisticas/ (relevado el 11/08/2026).
// Se usa una lista cerrada en vez de un regex genérico porque el ranking no tiene
// selectores propios por fila: es texto plano "MARCA\n<número>" repetido.
const MARCAS_CONOCIDAS = [
  'FIAT', 'TOYOTA', 'VOLKSWAGEN', 'PEUGEOT', 'RENAULT', 'CHEVROLET',
  'CITROEN', 'FORD', 'NISSAN', 'JEEP', 'RAM', 'LEAPMOTOR',
];

const extraerRanking = (texto: string): ItemRanking[] => {
  const items: ItemRanking[] = [];
  for (const marca of MARCAS_CONOCIDAS) {
    const m = texto.match(new RegExp(`\\b${marca}\\s*\\n?\\s*([\\d.,]+)\\s*%?`, 'i'));
    if (m) items.push({ marca, valor: numeroDesdeTexto(m[1]) });
  }
  return items.sort((a, b) => b.valor - a.valor);
};

// Patrones verificados contra el texto real renderizado por cca.com.ar (relevado con
// el modo debug de este mismo endpoint el 11/08/2026). Cada pestaña comparte el mismo
// formato: "TOTAL <ETIQUETA>\n<número>[%]", "MARCA LÍDER\n<MARCA>", "VARIACIÓN MENSUAL\n
// (↑|↓) <número>%", "PROMEDIO MENSUAL\n<número>" (no aplica a Conversión) y, dentro del
// ranking por marca, "<MARCA>\n<número>[%]" repetido por cada marca listada.
const extraerMetricaTab = (texto: string, etiquetaTotal: string): MetricaTab | null => {
  const totalMatch = texto.match(new RegExp(`${etiquetaTotal}\\s*\\n?\\s*([\\d.,]+)\\s*%?`, 'i'));
  const marcaLiderMatch = texto.match(/MARCA L[IÍ]DER\s*\n?\s*([A-ZÁÉÍÓÚÑ]+)\s*\n/i);
  const variacionMatch = texto.match(/VARIACI[OÓ]N MENSUAL[\s\S]{0,20}?(↑|↓)\s*([\d.,]+)\s*%/i);
  const promedioMatch = texto.match(/PROMEDIO MENSUAL\s*\n?\s*([\d.,]+)/i);
  const ranking = extraerRanking(texto);
  const renaultItem = ranking.find((r) => r.marca === 'RENAULT');

  if (!totalMatch || !marcaLiderMatch || !variacionMatch) return null;

  const signoVariacion = variacionMatch[1] === '↓' ? -1 : 1;

  return {
    total: numeroDesdeTexto(totalMatch[1]),
    marcaLider: marcaLiderMatch[1].trim(),
    variacionMensual: signoVariacion * numeroDesdeTexto(variacionMatch[2]),
    promedioMensual: promedioMatch ? numeroDesdeTexto(promedioMatch[1]) : null,
    renault: renaultItem ? renaultItem.valor : null,
    ranking,
  };
};

// Busca cualquier elemento clickeable cuyo texto coincida exacto con el nombre de la
// pestaña (la página no expone selectores estables, así que se busca por texto visible).
const clickearPestana = (page: Page, nombre: string): Promise<boolean> =>
  page.evaluate((texto) => {
    const candidatos = Array.from(document.querySelectorAll('button, a, [role="tab"], li, div, span'));
    const el = candidatos.find((e) => e.textContent?.trim() === texto);
    if (el instanceof HTMLElement) {
      el.click();
      return true;
    }
    return false;
  }, nombre);

const leerTexto = (page: Page): Promise<string> => page.evaluate(() => document.body.innerText);

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
    await esperar(2000);

    // "Suscripciones" es la pestaña activa por defecto al cargar la página.
    const textoSuscripciones = await leerTexto(page);

    // Modo debug (?debug=1 para la pestaña por defecto, o ?debug=<nombre> para
    // cualquier otra, ej. ?debug=FC): devuelve el texto renderizado crudo de esa
    // pestaña. Se deja disponible a propósito (no expone nada sensible, es una página
    // pública) para poder re-ajustar las regex de arriba rápido si CCA cambia el diseño.
    const debugParam = typeof req.query.debug === 'string' ? req.query.debug : null;
    if (debugParam) {
      const pestanaDebug = debugParam === '1' ? 'Suscripciones' : debugParam;
      let textoDebug = textoSuscripciones;
      if (pestanaDebug !== 'Suscripciones') {
        const clickeado = await clickearPestana(page, pestanaDebug);
        if (!clickeado) {
          res.status(200).json({ ok: true, debug: true, error: `No se encontró la pestaña "${pestanaDebug}".` });
          return;
        }
        await esperar(1500);
        textoDebug = await leerTexto(page);
      }
      res.status(200).json({ ok: true, debug: true, pestana: pestanaDebug, texto: textoDebug });
      return;
    }

    const datosSuscripciones = extraerMetricaTab(textoSuscripciones, 'TOTAL SUSCRIPCIONES');

    const clickeoFC = await clickearPestana(page, 'FC');
    await esperar(1500);
    const datosFC = clickeoFC ? extraerMetricaTab(await leerTexto(page), 'TOTAL FC') : null;

    const clickeoConversion = await clickearPestana(page, 'Conversión');
    await esperar(1500);
    const datosConversion = clickeoConversion ? extraerMetricaTab(await leerTexto(page), 'TOTAL CONVERSIÓN') : null;

    if (!datosSuscripciones || !datosFC || !datosConversion) {
      res.status(502).json({
        ok: false,
        error: 'Se renderizó cca.com.ar pero no se pudieron leer los valores esperados de alguna pestaña (Suscripciones/FC/Conversión). El sitio puede haber cambiado de diseño.',
      });
      return;
    }

    const cuotaRenault = (metrica: MetricaTab): number | null =>
      metrica.renault !== null && metrica.total > 0 ? (metrica.renault / metrica.total) * 100 : null;

    res.status(200).json({
      ok: true,
      datos: {
        suscripciones: {
          total: datosSuscripciones.total,
          marcaLider: datosSuscripciones.marcaLider,
          variacionMensual: datosSuscripciones.variacionMensual,
          promedioMensual: datosSuscripciones.promedioMensual,
          renault: datosSuscripciones.renault,
          cuotaRenault: cuotaRenault(datosSuscripciones),
          ranking: datosSuscripciones.ranking,
        },
        facturacion: {
          total: datosFC.total,
          marcaLider: datosFC.marcaLider,
          variacionMensual: datosFC.variacionMensual,
          promedioMensual: datosFC.promedioMensual,
          renault: datosFC.renault,
          cuotaRenault: cuotaRenault(datosFC),
          ranking: datosFC.ranking,
        },
        conversion: {
          // El total, el valor de Renault y el ranking de esta pestaña ya vienen
          // expresados en %.
          total: datosConversion.total,
          marcaLider: datosConversion.marcaLider,
          variacionMensual: datosConversion.variacionMensual,
          renault: datosConversion.renault,
          ranking: datosConversion.ranking,
        },
        mercadoTotal: {
          suscripciones: datosSuscripciones.total,
          facturacion: datosFC.total,
          conversionPct: datosConversion.total,
        },
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
