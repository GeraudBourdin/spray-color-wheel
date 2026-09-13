import { localizeDOM, relocalizeNotice, LANGUAGES } from "./localization.js?v=20260913-i18n-1";
const COPY = {
  fr: {
    create: "Créer", image: "Image", catalogue: "Nuanciers", list: "Ma liste", language: "Langue",
    studio: "L’atelier couleur", createTitle: "Composez votre prochaine palette.", createCopy: "Une couleur de départ. Des harmonies. Les bonnes bombes.",
    imageTitle: "Une image, votre inspiration.", imageCopy: "Prélevez vos couleurs, conservez-les et trouvez les bombes correspondantes.",
    listTitle: "Votre prochaine session, prête.", listCopy: "Retrouvez vos références, ajustez les quantités et emportez votre liste.",
    harmonies: "Harmonies", tones: "Tonalités", base: "Couleur de départ", composition: "Composition", harmony: "Harmonie",
    saved: "Couleurs conservées", combine: "Combiner plusieurs règles", proposed: "Palette proposée", fromImage: "Prélever depuis une image",
    continueCreate: "Continuer la création ↗", wheelSettings: "Affichage et aide de la roue", skip: "Aller au contenu", undo: "Annuler la suppression",
    accuracy: "Les couleurs à l’écran sont indicatives. Vérifiez le nuancier physique.", alternatives: "Autres marques", closest: "Référence la plus proche",
    custom: "Couleur libre", spray: "Bombe du nuancier", imageSource: "Prélèvement d’image", results: "Bombes correspondantes", colors: "couleurs",
    mixed: "Composition personnalisée", add: "Ajouter à ma liste", added: "Référence ajoutée à votre liste", kept: "Couleur conservée", removed: "Liste vidée. Vous pouvez annuler.",
    noMatches: "Aucune référence disponible dans les marques sélectionnées.", useBase: "Utiliser comme base", selected: "Sélectionnée", noImage: "Importez une image pour commencer", imageHint: "Cliquez dans l’image pour prélever une couleur. Agrandissez-la pour plus de précision.",
    free: "Couleur libre", catalogSource: "Depuis une bombe", brands: "Marques recherchées", countBrands: "gammes", none: "Couleur seule",
  },
  en: {
    create:"Create",image:"Image",catalogue:"Swatches",list:"My list",language:"Language",studio:"The color studio",
    createTitle:"Compose your next palette.",createCopy:"A starting color. Color harmonies. The right cans.",imageTitle:"An image. Your inspiration.",imageCopy:"Sample your colors, keep them and find matching spray cans.",listTitle:"Ready for your next session.",listCopy:"Review references, adjust quantities and take your list with you.",
    harmonies:"Harmonies",tones:"Tones",base:"Starting color",composition:"Composition",harmony:"Harmony",saved:"Saved colors",combine:"Combine multiple rules",proposed:"Suggested palette",fromImage:"Sample from an image",continueCreate:"Continue creating ↗",wheelSettings:"Wheel display and help",skip:"Skip to content",undo:"Undo removal",accuracy:"Screen colors are indicative. Check the physical color chart.",alternatives:"Other brands",closest:"Closest reference",custom:"Custom color",spray:"Catalog spray",imageSource:"Image sample",results:"Matching spray cans",colors:"colors",mixed:"Custom composition",add:"Add to my list",added:"Reference added to your list",kept:"Color saved",removed:"List cleared. You can undo.",noMatches:"No reference available in the selected brands.",useBase:"Use as base",selected:"Selected",noImage:"Import an image to get started",imageHint:"Click the image to sample a color. Enlarge it for more precision.",free:"Custom color",catalogSource:"From a spray",brands:"Selected brands",countBrands:"ranges",none:"Base only",
  },
};
COPY.de = {...COPY.en,create:"Erstellen",image:"Bild",catalogue:"Farbkarten",list:"Meine Liste",language:"Sprache",harmonies:"Harmonien",tones:"Farbtöne",base:"Ausgangsfarbe",composition:"Komposition",saved:"Gespeicherte Farben",proposed:"Farbpalette",results:"Passende Sprühfarben",add:"Zur Liste hinzufügen",undo:"Rückgängig",free:"Freie Farbe",catalogSource:"Aus dem Katalog",brands:"Ausgewählte Marken"};
COPY.es = {...COPY.en,create:"Crear",image:"Imagen",catalogue:"Cartas",list:"Mi lista",language:"Idioma",harmonies:"Armonías",tones:"Tonalidades",base:"Color inicial",composition:"Composición",saved:"Colores guardados",proposed:"Paleta propuesta",results:"Sprays correspondientes",add:"Añadir a mi lista",undo:"Deshacer",free:"Color libre",catalogSource:"Desde un spray",brands:"Marcas seleccionadas"};
COPY.pt = {...COPY.en,create:"Criar",image:"Imagem",catalogue:"Catálogos",list:"Minha lista",language:"Idioma",harmonies:"Harmonias",tones:"Tonalidades",base:"Cor inicial",composition:"Composição",saved:"Cores guardadas",proposed:"Paleta sugerida",results:"Sprays correspondentes",add:"Adicionar à lista",undo:"Desfazer",free:"Cor livre",catalogSource:"De um spray",brands:"Marcas selecionadas"};

Object.assign(COPY.de, {
 studio:"Das Farbatelier",createTitle:"Gestalte deine nächste Farbpalette.",createCopy:"Eine Ausgangsfarbe. Farbharmonien. Die passenden Sprühdosen.",imageTitle:"Ein Bild als Inspiration.",imageCopy:"Wähle Farben aus dem Bild, speichere sie und finde passende Sprühdosen.",listTitle:"Bereit für deine nächste Session.",listCopy:"Prüfe deine Auswahl, passe Mengen an und nimm deine Liste mit.",harmony:"Harmonie",combine:"Mehrere Regeln kombinieren",fromImage:"Farbe aus einem Bild wählen",continueCreate:"Weiter gestalten ↗",wheelSettings:"Farbrad: Anzeige und Hilfe",skip:"Zum Inhalt",accuracy:"Bildschirmfarben dienen der Orientierung. Prüfe die gedruckte Farbkarte.",alternatives:"Andere Marken",closest:"Nächster Farbton",custom:"Freie Farbe",spray:"Sprühfarbe aus dem Katalog",imageSource:"Farbe aus einem Bild",colors:"Farben",mixed:"Eigene Komposition",added:"Farbton zur Liste hinzugefügt",kept:"Farbe gespeichert",removed:"Liste geleert. Rückgängig machen ist möglich.",noMatches:"Kein Farbton der ausgewählten Marken verfügbar.",useBase:"Als Ausgangsfarbe verwenden",selected:"Ausgewählt",noImage:"Importiere zuerst ein Bild",imageHint:"Klicke auf das Bild, um eine Farbe zu wählen. Vergrößere es für mehr Präzision.",countBrands:"Serien",none:"Nur Ausgangsfarbe"
});
Object.assign(COPY.es, {
 studio:"El taller del color",createTitle:"Crea tu próxima paleta.",createCopy:"Un color inicial. Armonías. Los aerosoles adecuados.",imageTitle:"Una imagen como inspiración.",imageCopy:"Extrae colores, guárdalos y encuentra los aerosoles correspondientes.",listTitle:"Todo listo para tu próxima sesión.",listCopy:"Revisa las referencias, ajusta las cantidades y llévate tu lista.",harmony:"Armonía",combine:"Combinar varias reglas",fromImage:"Extraer de una imagen",continueCreate:"Seguir creando ↗",wheelSettings:"Visualización y ayuda de la rueda",skip:"Ir al contenido",accuracy:"Los colores de pantalla son orientativos. Consulta la carta física.",alternatives:"Otras marcas",closest:"Referencia más cercana",custom:"Color libre",spray:"Aerosol del catálogo",imageSource:"Muestra de imagen",colors:"colores",mixed:"Composición personalizada",added:"Referencia añadida a tu lista",kept:"Color guardado",removed:"Lista vaciada. Puedes deshacerlo.",noMatches:"No hay referencias disponibles en las marcas seleccionadas.",useBase:"Usar como base",selected:"Seleccionada",noImage:"Importa una imagen para empezar",imageHint:"Haz clic en la imagen para tomar una muestra de color. Amplíala para mayor precisión.",countBrands:"gamas",none:"Solo color base"
});
Object.assign(COPY.pt, {
 studio:"O ateliê da cor",createTitle:"Cria a tua próxima paleta.",createCopy:"Uma cor inicial. Harmonias. Os sprays certos.",imageTitle:"Uma imagem como inspiração.",imageCopy:"Recolhe cores, guarda-as e encontra os sprays correspondentes.",listTitle:"Tudo pronto para a próxima sessão.",listCopy:"Revê as referências, ajusta as quantidades e leva a tua lista.",harmony:"Harmonia",combine:"Combinar várias regras",fromImage:"Recolher de uma imagem",continueCreate:"Continuar a criar ↗",wheelSettings:"Visualização e ajuda da roda",skip:"Ir para o conteúdo",accuracy:"As cores no ecrã são indicativas. Consulta o catálogo físico.",alternatives:"Outras marcas",closest:"Referência mais próxima",custom:"Cor livre",spray:"Spray do catálogo",imageSource:"Amostra de imagem",colors:"cores",mixed:"Composição personalizada",added:"Referência adicionada à lista",kept:"Cor guardada",removed:"Lista esvaziada. Podes desfazer.",noMatches:"Nenhuma referência disponível nas marcas selecionadas.",useBase:"Usar como base",selected:"Selecionada",noImage:"Importa uma imagem para começar",imageHint:"Clica na imagem para recolher uma cor. Amplia-a para maior precisão.",countBrands:"gamas",none:"Apenas a cor base"
});
const EXTRA_COPY = {
 fr:{settings:"Réglages",navigation:"Navigation principale",creationMode:"Mode de création",colorSource:"Source de la couleur",listSummary:"Récapitulatif",listSummaryCopy:"Votre sélection de bombes pour la prochaine session.",clearList:"Vider ma liste",downloadList:"Télécharger la fiche imprimable",paletteSettings:"Réglages de la palette"},
 en:{settings:"Settings",navigation:"Main navigation",creationMode:"Creation mode",colorSource:"Color source",listSummary:"Summary",listSummaryCopy:"Your spray selection for the next session.",clearList:"Clear my list",downloadList:"Download printable sheet",paletteSettings:"Palette settings"},
 de:{settings:"Einstellungen",navigation:"Hauptnavigation",creationMode:"Gestaltungsmodus",colorSource:"Farbquelle",listSummary:"Übersicht",listSummaryCopy:"Deine Sprühfarben für die nächste Session.",clearList:"Meine Liste leeren",downloadList:"Druckvorlage herunterladen",paletteSettings:"Paletteneinstellungen"},
 es:{settings:"Ajustes",navigation:"Navegación principal",creationMode:"Modo de creación",colorSource:"Origen del color",listSummary:"Resumen",listSummaryCopy:"Tus aerosoles para la próxima sesión.",clearList:"Vaciar mi lista",downloadList:"Descargar ficha imprimible",paletteSettings:"Ajustes de la paleta"},
 pt:{settings:"Definições",navigation:"Navegação principal",creationMode:"Modo de criação",colorSource:"Origem da cor",listSummary:"Resumo",listSummaryCopy:"Os teus sprays para a próxima sessão.",clearList:"Esvaziar a lista",downloadList:"Descarregar ficha para imprimir",paletteSettings:"Definições da paleta"}
};
for (const [language, copy] of Object.entries(EXTRA_COPY)) Object.assign(COPY[language], copy);

const PAGE_COPY = {
  "fr": {
    "catalogTitle": "Trouvez la bonne référence.",
    "catalogCopy": "Explorez les nuanciers, comparez les couleurs et préparez votre liste.",
    "tonesTitle": "Donnez du relief à votre palette.",
    "tonesCopy": "Une base, des ombres et de la lumière. Trouvez vos tonalités dans une même gamme.",
    "manufacturer": "Fabricant",
    "chooseBrand": "Choisir une marque de spray",
    "catalogSearch": "Rechercher dans le nuancier",
    "families": "Familles de couleurs",
    "bulkSearch": "Retrouver une liste de références",
    "pasteReferences": "Collez vos références",
    "autoOptions": "Options d’ajout automatique",
    "detailedCards": "Fiches détaillées",
    "addSelection": "Ajouter la sélection à ma liste",
    "brandBase": "Marque et base",
    "toneCount": "Nombre de tonalites",
    "threeTones": "3 tonalites",
    "fourTones": "4 tonalites",
    "startingColors": "Couleurs de départ",
    "midToneHint": "Choisissez une couleur de ton moyen pour obtenir une progression du sombre au clair.",
    "theoreticalRamp": "Rampe theorique",
    "recommendedReferences": "References recommandees"
  },
  "en": {
    "catalogTitle": "Find the right reference.",
    "catalogCopy": "Explore color charts, compare colors and prepare your list.",
    "tonesTitle": "Add depth to your palette.",
    "tonesCopy": "A base, shadows and highlights. Find your tones within one range.",
    "manufacturer": "Manufacturer",
    "chooseBrand": "Choose a spray brand",
    "catalogSearch": "Search the color chart",
    "families": "Color families",
    "bulkSearch": "Find a list of references",
    "pasteReferences": "Paste your references",
    "autoOptions": "Automatic addition options",
    "detailedCards": "Detailed cards",
    "addSelection": "Add selection to my list",
    "brandBase": "Brand and base",
    "toneCount": "Number of tones",
    "threeTones": "3 tones",
    "fourTones": "4 tones",
    "startingColors": "Starting colors",
    "midToneHint": "Choose a midtone color for a progression from dark to light.",
    "theoreticalRamp": "Theoretical gradient",
    "recommendedReferences": "Recommended references"
  },
  "de": {
    "catalogTitle": "Finde den passenden Farbton.",
    "catalogCopy": "Entdecke Farbkarten, vergleiche Farben und stelle deine Liste zusammen.",
    "tonesTitle": "Verleihe deiner Palette Tiefe.",
    "tonesCopy": "Eine Basis, Schatten und Licht. Finde deine Farbtöne innerhalb einer Serie.",
    "manufacturer": "Hersteller",
    "chooseBrand": "Sprühfarbenmarke wählen",
    "catalogSearch": "Farbkarte durchsuchen",
    "families": "Farbfamilien",
    "bulkSearch": "Referenzliste suchen",
    "pasteReferences": "Referenzen einfügen",
    "autoOptions": "Optionen zum automatischen Hinzufügen",
    "detailedCards": "Detailansicht",
    "addSelection": "Auswahl zu meiner Liste hinzufügen",
    "brandBase": "Marke und Basis",
    "toneCount": "Anzahl der Farbtöne",
    "threeTones": "3 Farbtöne",
    "fourTones": "4 Farbtöne",
    "startingColors": "Ausgangsfarben",
    "midToneHint": "Wähle einen mittleren Farbton für einen Verlauf von dunkel nach hell.",
    "theoreticalRamp": "Theoretischer Farbverlauf",
    "recommendedReferences": "Empfohlene Farbtöne"
  },
  "es": {
    "catalogTitle": "Encuentra la referencia adecuada.",
    "catalogCopy": "Explora las cartas de colores, compara y prepara tu lista.",
    "tonesTitle": "Dale profundidad a tu paleta.",
    "tonesCopy": "Una base, sombras y luces. Encuentra tus tonos en una misma gama.",
    "manufacturer": "Fabricante",
    "chooseBrand": "Elegir una marca de aerosol",
    "catalogSearch": "Buscar en la carta",
    "families": "Familias de colores",
    "bulkSearch": "Buscar una lista de referencias",
    "pasteReferences": "Pega tus referencias",
    "autoOptions": "Opciones de adición automática",
    "detailedCards": "Fichas detalladas",
    "addSelection": "Añadir selección a mi lista",
    "brandBase": "Marca y base",
    "toneCount": "Número de tonos",
    "threeTones": "3 tonos",
    "fourTones": "4 tonos",
    "startingColors": "Colores iniciales",
    "midToneHint": "Elige un tono medio para una progresión de oscuro a claro.",
    "theoreticalRamp": "Gradiente teórico",
    "recommendedReferences": "Referencias recomendadas"
  },
  "pt": {
    "catalogTitle": "Encontra a referência certa.",
    "catalogCopy": "Explora os catálogos, compara cores e prepara a tua lista.",
    "tonesTitle": "Dá profundidade à tua paleta.",
    "tonesCopy": "Uma base, sombras e luz. Encontra os tons na mesma gama.",
    "manufacturer": "Fabricante",
    "chooseBrand": "Escolher uma marca de spray",
    "catalogSearch": "Pesquisar no catálogo",
    "families": "Famílias de cores",
    "bulkSearch": "Encontrar uma lista de referências",
    "pasteReferences": "Cola as referências",
    "autoOptions": "Opções de adição automática",
    "detailedCards": "Fichas detalhadas",
    "addSelection": "Adicionar seleção à lista",
    "brandBase": "Marca e base",
    "toneCount": "Número de tons",
    "threeTones": "3 tons",
    "fourTones": "4 tons",
    "startingColors": "Cores iniciais",
    "midToneHint": "Escolhe um tom médio para uma progressão do escuro ao claro.",
    "theoreticalRamp": "Gradiente teórico",
    "recommendedReferences": "Referências recomendadas"
  }
};
for (const [language, copy] of Object.entries(PAGE_COPY)) Object.assign(COPY[language], copy);

for (const [lang, label] of Object.entries({fr:'Mur',en:'Wall',de:'Wand',es:'Muro',pt:'Muro'})) COPY[lang].wall = label;

export function workspaceText(key, language = document.documentElement.lang) {
  return (COPY[language] || COPY.fr)[key] || COPY.en[key] || key;
}

export function updateCartCount(items) {
  const count = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = String(count); });
}

export function renderWorkspaceChrome(language, page = document.body.dataset.page) {
  language = LANGUAGES.includes(language) ? language : "fr";
  const changed = document.documentElement.lang !== language;
  document.documentElement.lang = language;
  document.querySelectorAll('[data-ws-aria]').forEach(el => { el.setAttribute('aria-label',workspaceText(el.dataset.wsAria,language)); });
  document.querySelectorAll('[data-ws]').forEach(el => { el.textContent = workspaceText(el.dataset.ws, language); });
  document.querySelectorAll('[data-nav]').forEach(link => {
    const active = link.dataset.nav === (page === 'tones' ? 'create' : page);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.documentElement.lang = language;
  document.querySelectorAll('.language-code').forEach(el => { el.textContent = language.toUpperCase(); });
  document.querySelectorAll('.language-options').forEach(el => {
    el.setAttribute('aria-label', workspaceText('language', language));
    el.querySelectorAll('[data-language]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.language === language)); });
  });
  for (const [selector, key] of [['.primary-nav','navigation'],['.mode-nav','creationMode'],['.source-tabs[role="tablist"]','colorSource']]) document.querySelector(selector)?.setAttribute('aria-label', workspaceText(key,language));
  const select = document.querySelector('#workspace-language');
  if (select) select.value = language;
  localizeDOM();
  if (changed) document.querySelectorAll("#workspace-toast, #wall-status, #catalog-feedback, #tones-feedback").forEach(node => { if(node.textContent.trim()) node.textContent=relocalizeNotice(node.textContent, language); });
  if (changed) document.dispatchEvent(new CustomEvent("languagechange", {detail: {language}}));
}

let toastTimer;
export function showToast(message) {
  const toast = document.querySelector('#workspace-toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

const icons = {
  wall:'<rect x="3" y="7" width="14" height="14" rx="2"/><rect x="8" y="3" width="13" height="13" rx="2"/><path d="m10 12 3-5 4 6"/>',
  palette:'<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="8" cy="14" r="1"/><path d="M16 19c-3-1-4-3-1-5 3-1 5 0 5-3"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',
  settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
};
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[el.dataset.icon] || ''}</svg>`;
});
document.querySelectorAll('.language-options').forEach(container => {
  // The five choices are in the HTML so the menu is never visually empty.
  container.addEventListener('click', event => {
    const button = event.target.closest('[data-language]');
    if (!button) return;
    const select = document.querySelector('#language-select, #workspace-language');
    select.value = button.dataset.language;
    select.dispatchEvent(new Event('change', { bubbles:true }));
    const menu = container.closest('details');
    menu.open = false;
    menu.querySelector('summary').focus();
  });
});
let language = 'fr';
try {
  language = localStorage.getItem('spray-color-wheel.language') || 'fr';
  updateCartCount(JSON.parse(localStorage.getItem('spray-color-wheel.cart') || '[]'));
} catch { /* Storage can be unavailable. */ }
renderWorkspaceChrome(language);
document.querySelector('#workspace-language')?.addEventListener('change', event => {
  language = event.target.value;
  try { localStorage.setItem('spray-color-wheel.language', language); } catch { /* Local only. */ }
  renderWorkspaceChrome(language);
});
window.addEventListener('storage', event => {
  if (event.key === 'spray-color-wheel.cart') {
    try { updateCartCount(JSON.parse(event.newValue || '[]')); } catch { /* Keep last valid count. */ }
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.utility-menu[open]').forEach(el => { el.open = false; el.querySelector('summary').focus(); });
});

if (matchMedia('(max-width: 767px)').matches) {
  const families = document.querySelector('#catalog-group-index-shell');
  if (families) families.open = false;
}
