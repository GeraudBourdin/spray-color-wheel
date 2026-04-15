export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = [
  { id: "fr", label: "Francais" },
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
  { id: "es", label: "Espanol" },
  { id: "pt", label: "Portugues" },
];

const LOCALE_TAGS = {
  fr: "fr-FR",
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  pt: "pt-PT",
};

const UI_STRINGS = {
  fr: {
    documentTitle: "Roue chromatique spray",
    topbarEyebrow: "Catalogue multi-fabricants",
    topbarTitle: "Roue chromatique spray",
    controlMenuEyebrow: "Navigation",
    controlMenuTitle: "Menu",
    controlMenuOpen: "Ouvrir le menu",
    controlMenuClose: "Fermer le menu",
    languageLabel: "Langue de reference",
    algorithmsLabel: "Algorithmes",
    manufacturersLabel: "Fabricants",
    baseControlsLabel: "Choisir la couleur de base",
    hexLabel: "HEX",
    hueLabel: "Teinte",
    saturationLabel: "Saturation",
    lightnessLabel: "Luminosite",
    imageLabel: "Image source",
    imageUploadLabel: "Importer une image",
    imageHint: "Charge une image, ouvre la pipette en grand, clique dans l'image puis garde la couleur.",
    imageRemove: "Retirer",
    imageReset: "Reinitialiser image + couleurs",
    imageEmpty: "Aucune image chargee.",
    imageSampleLabel: "Couleur pipetee",
    imageSampleEmpty: "Choisis une couleur dans la pop-in pour la memoriser.",
    imageSaveColor: "Garder cette couleur",
    imagePaletteLabel: "Palette",
    imagePaletteEmpty: "Aucune couleur en palette pour le moment.",
    imageActive: "Base active",
    imagePaletteBrand: "Palette",
    sourceImage: "couleur image",
    imageLoadError: "Impossible de charger cette image.",
    imageOpenModal: "Ouvrir la pipette en grand",
    imageModalTitle: "Choisir une couleur de reference",
    imageModalHint: "Clique dans l'image pour prelever une couleur plus precisement.",
    imageModalZoomLabel: "Zoom",
    imageModalZoomOut: "Dezoomer",
    imageModalZoomIn: "Zoomer",
    imageModalZoomReset: "Ajuster",
    imageCanvasAria: "Image source a echantillonner",
    imagePreviewAria: "Apercu de l'image source",
    pickerLabel: "Choisir un spray",
    pickerPlaceholder: "Loop, Montana, code, nom",
    wheelEyebrow: "Creation",
    wheelLayersLabel: "Affichage de la roue",
    wheelSnapLabel: "Mode de selection",
    showWheelSurface: "Afficher le fond",
    hideWheelSurface: "Masquer le fond",
    showWheelSprays: "Afficher les sprays",
    hideWheelSprays: "Masquer les sprays",
    snapToTheory: "Snap to theory",
    snapToCans: "Snap to cans",
    wheelGuideLabel: "Lire la roue",
    showWheelGuide: "Comprendre la roue",
    hideWheelGuide: "Masquer l'aide",
    wheelLegendHue: "Autour = teinte",
    wheelLegendCenter: "Centre = desature",
    wheelLegendEdge: "Bord = sature",
    wheelLegendLightness: "Luminosite separee · L {lightness}",
    wheelGuideCopy:
      "La distance au centre montre la force chromatique, pas le clair ou fonce. Des sprays clairs et fonces peuvent donc se retrouver au meme rayon.",
    wheelGuideStepAngleTitle: "Autour: changer de famille",
    wheelGuideStepAngleCopy:
      "Quand tu tournes autour du cercle, tu changes surtout de teinte: rouge, orange, vert, bleu.",
    wheelGuideStepRadiusTitle: "Vers le bord: plus de presence",
    wheelGuideStepRadiusCopy:
      "Vers le bord, la couleur devient plus vive et plus saturee. Vers le centre, elle devient plus cassee et plus grisee.",
    wheelGuideStepLightnessTitle: "Clair ou fonce: a part",
    wheelGuideStepLightnessCopy:
      "La luminosite actuelle est {lightness}. Elle se regle avec le slider Luminosite ou le HEX, pas avec la distance au centre.",
    noAccessibleCan: "aucun spray assez proche",
    paletteEyebrow: "Palette",
    paletteTitle: "Choix de sprays",
    cartLabel: "Panier de sprays",
    cartCopy: "Clique une reference dans Choix de sprays pour l'ajouter ici.",
    copyHexAction: "Copier HEX",
    copyReferenceAction: "Copier ref",
    copiedAction: "Copie",
    copyFailed: "Impossible de copier cette valeur.",
    stayInTouch: "Rester en contact",
    clear: "Vider",
    addToPalette: "Ajouter a la palette",
    inPalette: "Dans la palette",
    cartActionLabel: "Panier",
    removeAction: "Supprimer",
    cartEmptyAction: "Vider le panier",
    close: "Fermer",
    downloadPrintable: "Telecharger la fiche imprimable",
    tooltipPrinciple: "Principe",
    tooltipConstruction: "Construction",
    tooltipUsage: "Usage graffiti",
    tooltipActivateTheory: "Activer l'algorithme {theory}",
    printAppName: "Roue chromatique spray",
    printTitle: "Selection de sprays",
    printHtmlTitle: "Selection de sprays",
    printGeneratedOn: "Genere le {date}",
    printButton: "Imprimer",
    errorLoadingTitle: "Erreur de chargement",
    errorLoadingApp: "Impossible de charger l'application.",
    manifestLoadError: "Le manifest fabricants n'a pas pu etre charge.",
    noManufacturersDeclared: "Aucun fabricant n'est declare dans manufacturers/index.json.",
    catalogLoadError: "Le catalogue {name} n'a pas pu etre charge.",
    noColorsLoaded: "Aucune couleur n'a ete chargee.",
    runViaServer: "Lance l'app via un serveur HTTP local pour permettre le chargement des fichiers JSON.",
    presetAll: "Tous",
    presetBoth: "Les deux",
    presetOnly: "{brand} seul",
    customBrand: "Custom",
    baseColorName: "Couleur de base",
    baseReferenceLabel: "Reference de base",
    chromaticRequired: "necessite une teinte chromatique. Augmente la saturation ou utilise une regle de variation.",
    reference: "Reference",
    sourceColor: "couleur source",
    freeBase: "base libre",
    baseTitle: "Base",
    noActiveAlgorithmShort: "Aucun algorithme actif.",
    noSearchResult: "Aucun spray trouve pour cette recherche.",
    emptyCart: "Le panier est vide. Ajoute des references depuis Choix de sprays.",
    baseAloneTitle: "Base seule",
    zeroAlgorithm: "0 algorithme",
    activateAlgorithms: "Active un ou plusieurs algorithmes pour projeter des palettes sur la roue.",
    blockedAlgorithmsTitle: "Algorithmes bloques",
    blockedAlgorithmsDescription:
      "Les algorithmes choisis sont actifs mais la couleur de base actuelle ne permet pas de produire leurs sorties.",
    overlaidRulesDescription:
      "Les regles selectionnees se superposent sur la roue et les correspondances fabricants sont calculees pour chaque sortie.",
    sourcePrefix: "Source {source}",
    sourceCustom: "Source custom",
    noActiveWheelNote: "Aucun algorithme actif. La roue affiche uniquement la couleur de base.",
    blockedLabel: "bloque",
    expandResults: "Details",
    collapseResults: "Replier",
    basePrefix: "Base {hex} · {description}",
    add: "Ajouter",
    useAsBase: "Choisir",
    noDerivedOutput: "Aucune sortie derivee pour cette regle.",
    helpAria: "Aide {theory}",
    wheelAria: "Cercle chromatique interactif",
    quantityLabel: "Quantite : {count}",
    quantityAria: "Quantite {title}",
    count: {
      sprayColor: { one: "{count} couleur spray", other: "{count} couleurs spray" },
      manufacturer: { one: "{count} fabricant", other: "{count} fabricants" },
      algorithm: { one: "{count} algorithme", other: "{count} algorithmes" },
      activeAlgorithm: { one: "{count} algorithme actif", other: "{count} algorithmes actifs" },
      sprayInCart: { one: "{count} spray en panier", other: "{count} sprays en panier" },
      reference: { one: "{count} reference", other: "{count} references" },
      spray: { one: "{count} spray", other: "{count} sprays" },
      block: { one: "{count} bloc", other: "{count} blocs" },
      color: { one: "{count} couleur", other: "{count} couleurs" },
      selection: { one: "{count} selection", other: "{count} selections" },
    },
    units: {
      degree: "deg",
      white: "blanc",
      black: "noir",
      gray: "gris",
    },
    generated: {
      strongShadow: "ombre forte",
      support: "appui",
      opening: "ouverture",
      light: "lumiere",
    },
  },
  de: {
    documentTitle: "Spray-Farbkreis",
    topbarEyebrow: "Mehrmarken-Katalog",
    topbarTitle: "Spray-Farbkreis",
    controlMenuEyebrow: "Navigation",
    controlMenuTitle: "Menue",
    controlMenuOpen: "Menue oeffnen",
    controlMenuClose: "Menue schliessen",
    languageLabel: "Referenzsprache",
    algorithmsLabel: "Algorithmen",
    manufacturersLabel: "Hersteller",
    baseControlsLabel: "Basisfarbe waehlen",
    hexLabel: "HEX",
    hueLabel: "Farbton",
    saturationLabel: "Saettigung",
    lightnessLabel: "Helligkeit",
    imageLabel: "Bildquelle",
    imageUploadLabel: "Bild importieren",
    imageHint: "Lade ein Bild, oeffne die grosse Pipette, klicke ins Bild und speichere dann die Farbe.",
    imageRemove: "Entfernen",
    imageReset: "Bild + Farben zuruecksetzen",
    imageEmpty: "Kein Bild geladen.",
    imageSampleLabel: "Aufgenommene Farbe",
    imageSampleEmpty: "Waehle eine Farbe im Pop-in, um sie zu speichern.",
    imageSaveColor: "Farbe behalten",
    imagePaletteLabel: "Palette",
    imagePaletteEmpty: "Noch keine Farbe in der Palette.",
    imageActive: "Aktive Basis",
    imagePaletteBrand: "Palette",
    sourceImage: "Bildfarbe",
    imageLoadError: "Dieses Bild konnte nicht geladen werden.",
    imageOpenModal: "Grosse Pipette oeffnen",
    imageModalTitle: "Referenzfarbe waehlen",
    imageModalHint: "Klicke in das Bild, um eine Farbe genauer zu sampeln.",
    imageModalZoomLabel: "Zoom",
    imageModalZoomOut: "Herauszoomen",
    imageModalZoomIn: "Hineinzoomen",
    imageModalZoomReset: "Einpassen",
    imageCanvasAria: "Quellbild zum Sampeln",
    imagePreviewAria: "Vorschau des Quellbilds",
    pickerLabel: "Sprayfarbe waehlen",
    pickerPlaceholder: "Loop, Montana, Code, Name",
    wheelEyebrow: "Erstellung",
    wheelGuideLabel: "Rad lesen",
    showWheelGuide: "Rad erklaeren",
    hideWheelGuide: "Hilfe ausblenden",
    wheelLegendHue: "Rundherum = Farbton",
    wheelLegendCenter: "Mitte = entsaettigt",
    wheelLegendEdge: "Rand = saettigt",
    wheelLegendLightness: "Helligkeit getrennt · L {lightness}",
    wheelGuideCopy:
      "Der Abstand zur Mitte zeigt die chromatische Staerke, nicht hell oder dunkel. Helle und dunkle Sprays koennen deshalb auf demselben Radius liegen.",
    wheelGuideStepAngleTitle: "Rundherum: Familie wechseln",
    wheelGuideStepAngleCopy:
      "Wenn du rund um den Kreis gehst, wechselst du vor allem den Farbton: Rot, Orange, Gruen, Blau.",
    wheelGuideStepRadiusTitle: "Zum Rand: mehr Praesenz",
    wheelGuideStepRadiusCopy:
      "Weiter aussen wird die Farbe kraeftiger und saettiger. Zur Mitte hin wird sie stumpfer und grauer.",
    wheelGuideStepLightnessTitle: "Hell oder dunkel: getrennt",
    wheelGuideStepLightnessCopy:
      "Die aktuelle Helligkeit ist {lightness}. Du regelst sie mit dem Helligkeit-Regler oder per HEX, nicht mit dem Abstand zur Mitte.",
    paletteEyebrow: "Palette",
    paletteTitle: "Spray-Auswahl",
    cartLabel: "Spray-Warenkorb",
    cartCopy: "Klicke in der Spray-Auswahl auf eine Referenz, um sie hier hinzuzufuegen.",
    copyHexAction: "HEX kopieren",
    copyReferenceAction: "Ref kopieren",
    copiedAction: "Kopiert",
    copyFailed: "Dieser Wert konnte nicht kopiert werden.",
    stayInTouch: "In Kontakt bleiben",
    clear: "Leeren",
    addToPalette: "Zur Palette",
    inPalette: "In der Palette",
    cartActionLabel: "Korb",
    removeAction: "Entfernen",
    cartEmptyAction: "Warenkorb leeren",
    close: "Schliessen",
    downloadPrintable: "Druckbare Liste herunterladen",
    tooltipPrinciple: "Prinzip",
    tooltipConstruction: "Aufbau",
    tooltipUsage: "Graffiti-Einsatz",
    tooltipActivateTheory: "Algorithmus {theory} aktivieren",
    printAppName: "Spray-Farbkreis",
    printTitle: "Spray-Auswahl",
    printHtmlTitle: "Spray-Auswahl",
    printGeneratedOn: "Erstellt am {date}",
    printButton: "Drucken",
    errorLoadingTitle: "Ladefehler",
    errorLoadingApp: "Die Anwendung konnte nicht geladen werden.",
    manifestLoadError: "Das Hersteller-Manifest konnte nicht geladen werden.",
    noManufacturersDeclared: "In manufacturers/index.json ist kein Hersteller definiert.",
    catalogLoadError: "Der Katalog {name} konnte nicht geladen werden.",
    noColorsLoaded: "Es wurden keine Farben geladen.",
    runViaServer: "Starte die App ueber einen lokalen HTTP-Server, damit die JSON-Dateien geladen werden koennen.",
    presetAll: "Alle",
    presetBoth: "Beide",
    presetOnly: "nur {brand}",
    customBrand: "Benutzerdefiniert",
    baseColorName: "Basisfarbe",
    baseReferenceLabel: "Basisreferenz",
    chromaticRequired:
      "benoetigt einen chromatischen Farbton. Erhoehe die Saettigung oder nutze eine Variationsregel.",
    reference: "Referenz",
    sourceColor: "Quellfarbe",
    freeBase: "freie Basis",
    baseTitle: "Basis",
    noActiveAlgorithmShort: "Kein Algorithmus aktiv.",
    noSearchResult: "Keine Sprayfarbe fuer diese Suche gefunden.",
    emptyCart: "Der Warenkorb ist leer. Fuege Referenzen aus der Spray-Auswahl hinzu.",
    baseAloneTitle: "Nur Basis",
    zeroAlgorithm: "0 Algorithmen",
    activateAlgorithms: "Aktiviere einen oder mehrere Algorithmen, um Paletten auf das Rad zu projizieren.",
    blockedAlgorithmsTitle: "Algorithmen blockiert",
    blockedAlgorithmsDescription:
      "Die gewaehlten Algorithmen sind aktiv, aber die aktuelle Basisfarbe erlaubt keine gueltigen Ausgaben.",
    overlaidRulesDescription:
      "Die gewaehlten Regeln werden auf dem Rad ueberlagert, und fuer jede Ausgabe werden Hersteller-Treffer berechnet.",
    sourcePrefix: "Quelle {source}",
    sourceCustom: "Quelle frei",
    noActiveWheelNote: "Kein Algorithmus aktiv. Das Rad zeigt nur die Basisfarbe.",
    blockedLabel: "blockiert",
    expandResults: "Details",
    collapseResults: "Zuklappen",
    basePrefix: "Basis {hex} · {description}",
    add: "Hinzufuegen",
    useAsBase: "Nutzen",
    noDerivedOutput: "Keine abgeleitete Ausgabe fuer diese Regel.",
    helpAria: "Hilfe {theory}",
    wheelAria: "Interaktiver Farbkreis",
    quantityLabel: "Menge: {count}",
    quantityAria: "Menge {title}",
    count: {
      sprayColor: { one: "{count} Sprayfarbe", other: "{count} Sprayfarben" },
      manufacturer: { one: "{count} Hersteller", other: "{count} Hersteller" },
      algorithm: { one: "{count} Algorithmus", other: "{count} Algorithmen" },
      activeAlgorithm: { one: "{count} aktiver Algorithmus", other: "{count} aktive Algorithmen" },
      sprayInCart: { one: "{count} Spray im Warenkorb", other: "{count} Sprays im Warenkorb" },
      reference: { one: "{count} Referenz", other: "{count} Referenzen" },
      spray: { one: "{count} Spray", other: "{count} Sprays" },
      block: { one: "{count} Block", other: "{count} Bloecke" },
      color: { one: "{count} Farbe", other: "{count} Farben" },
      selection: { one: "{count} Auswahl", other: "{count} Auswahlen" },
    },
    units: {
      degree: "Grad",
      white: "Weiss",
      black: "Schwarz",
      gray: "Grau",
    },
    generated: {
      strongShadow: "starker Schatten",
      support: "Stuetze",
      opening: "Oeffnung",
      light: "Licht",
    },
  },
  en: {
    documentTitle: "Spray Color Wheel",
    topbarEyebrow: "Multi-manufacturer catalog",
    topbarTitle: "Spray Color Wheel",
    controlMenuEyebrow: "Navigation",
    controlMenuTitle: "Menu",
    controlMenuOpen: "Open menu",
    controlMenuClose: "Close menu",
    languageLabel: "Reference language",
    algorithmsLabel: "Algorithms",
    manufacturersLabel: "Manufacturers",
    baseControlsLabel: "Choose base color",
    hexLabel: "HEX",
    hueLabel: "Hue",
    saturationLabel: "Saturation",
    lightnessLabel: "Lightness",
    imageLabel: "Source image",
    imageUploadLabel: "Upload an image",
    imageHint: "Load an image, open the large picker, click inside the image, then keep the color.",
    imageRemove: "Remove",
    imageReset: "Reset image + colors",
    imageEmpty: "No image loaded.",
    imageSampleLabel: "Picked color",
    imageSampleEmpty: "Pick a color in the modal to store it.",
    imageSaveColor: "Keep this color",
    imagePaletteLabel: "Palette",
    imagePaletteEmpty: "No color in the palette yet.",
    imageActive: "Active base",
    imagePaletteBrand: "Palette",
    sourceImage: "image color",
    imageLoadError: "This image could not be loaded.",
    imageOpenModal: "Open large picker",
    imageModalTitle: "Choose a reference color",
    imageModalHint: "Click inside the image to sample a color more precisely.",
    imageModalZoomLabel: "Zoom",
    imageModalZoomOut: "Zoom out",
    imageModalZoomIn: "Zoom in",
    imageModalZoomReset: "Fit",
    imageCanvasAria: "Source image to sample",
    imagePreviewAria: "Source image preview",
    pickerLabel: "Choose a spray color",
    pickerPlaceholder: "Loop, Montana, code, name",
    wheelEyebrow: "Create",
    wheelLayersLabel: "Wheel display",
    wheelSnapLabel: "Selection mode",
    showWheelSurface: "Show background",
    hideWheelSurface: "Hide background",
    showWheelSprays: "Show sprays",
    hideWheelSprays: "Hide sprays",
    snapToTheory: "Snap to theory",
    snapToCans: "Snap to cans",
    wheelGuideLabel: "Read the wheel",
    showWheelGuide: "Understand the wheel",
    hideWheelGuide: "Hide guide",
    wheelLegendHue: "Around = hue",
    wheelLegendCenter: "Center = muted",
    wheelLegendEdge: "Edge = vivid",
    wheelLegendLightness: "Lightness separate · L {lightness}",
    wheelGuideCopy:
      "Distance from the center shows chromatic strength, not light or dark. Light and dark sprays can therefore sit at the same radius.",
    wheelGuideStepAngleTitle: "Around: change family",
    wheelGuideStepAngleCopy:
      "When you move around the circle, you mostly change hue: red, orange, green, blue.",
    wheelGuideStepRadiusTitle: "Toward the edge: more presence",
    wheelGuideStepRadiusCopy:
      "Moving outward makes the color more vivid and saturated. Moving inward makes it more muted and gray.",
    wheelGuideStepLightnessTitle: "Light or dark: separate control",
    wheelGuideStepLightnessCopy:
      "Current lightness is {lightness}. Adjust it with the Lightness slider or HEX, not with the distance from the center.",
    noAccessibleCan: "no can close enough",
    paletteEyebrow: "Palette",
    paletteTitle: "Spray choices",
    cartLabel: "Spray cart",
    cartCopy: "Click a reference in Spray choices to add it here.",
    copyHexAction: "Copy HEX",
    copyReferenceAction: "Copy ref",
    copiedAction: "Copied",
    copyFailed: "This value could not be copied.",
    stayInTouch: "Stay in touch",
    clear: "Clear",
    addToPalette: "Add to palette",
    inPalette: "In palette",
    cartActionLabel: "Cart",
    removeAction: "Remove",
    cartEmptyAction: "Empty cart",
    close: "Close",
    downloadPrintable: "Download printable sheet",
    tooltipPrinciple: "Principle",
    tooltipConstruction: "Construction",
    tooltipUsage: "Graffiti use",
    tooltipActivateTheory: "Activate {theory}",
    printAppName: "Spray Color Wheel",
    printTitle: "Spray selection",
    printHtmlTitle: "Spray selection",
    printGeneratedOn: "Generated on {date}",
    printButton: "Print",
    errorLoadingTitle: "Loading error",
    errorLoadingApp: "The application could not be loaded.",
    manifestLoadError: "The manufacturers manifest could not be loaded.",
    noManufacturersDeclared: "No manufacturer is declared in manufacturers/index.json.",
    catalogLoadError: "The catalog {name} could not be loaded.",
    noColorsLoaded: "No colors were loaded.",
    runViaServer: "Run the app through a local HTTP server so the JSON files can be loaded.",
    presetAll: "All",
    presetBoth: "Both",
    presetOnly: "{brand} only",
    customBrand: "Custom",
    baseColorName: "Base color",
    baseReferenceLabel: "Base color reference",
    chromaticRequired:
      "requires a chromatic hue. Increase saturation or use a variation rule.",
    reference: "Reference",
    sourceColor: "source color",
    freeBase: "free base",
    baseTitle: "Base",
    noActiveAlgorithmShort: "No active algorithm.",
    noSearchResult: "No spray color found for this search.",
    emptyCart: "The cart is empty. Add references from Spray choices.",
    baseAloneTitle: "Base only",
    zeroAlgorithm: "0 algorithms",
    activateAlgorithms: "Activate one or more algorithms to project palettes onto the wheel.",
    blockedAlgorithmsTitle: "Blocked algorithms",
    blockedAlgorithmsDescription:
      "The selected algorithms are active, but the current base color cannot produce valid outputs.",
    overlaidRulesDescription:
      "The selected rules are overlaid on the wheel, and manufacturer matches are calculated for each output.",
    sourcePrefix: "Source {source}",
    sourceCustom: "Custom source",
    noActiveWheelNote: "No active algorithm. The wheel only shows the base color.",
    blockedLabel: "blocked",
    expandResults: "Details",
    collapseResults: "Collapse",
    basePrefix: "Base {hex} · {description}",
    add: "Add",
    useAsBase: "Use",
    noDerivedOutput: "No derived output for this rule.",
    helpAria: "Help {theory}",
    wheelAria: "Interactive color wheel",
    quantityLabel: "Qty: {count}",
    quantityAria: "Quantity {title}",
    count: {
      sprayColor: { one: "{count} spray color", other: "{count} spray colors" },
      manufacturer: { one: "{count} manufacturer", other: "{count} manufacturers" },
      algorithm: { one: "{count} algorithm", other: "{count} algorithms" },
      activeAlgorithm: { one: "{count} active algorithm", other: "{count} active algorithms" },
      sprayInCart: { one: "{count} spray in cart", other: "{count} sprays in cart" },
      reference: { one: "{count} reference", other: "{count} references" },
      spray: { one: "{count} spray", other: "{count} sprays" },
      block: { one: "{count} block", other: "{count} blocks" },
      color: { one: "{count} color", other: "{count} colors" },
      selection: { one: "{count} selection", other: "{count} selections" },
    },
    units: {
      degree: "deg",
      white: "white",
      black: "black",
      gray: "gray",
    },
    generated: {
      strongShadow: "strong shadow",
      support: "support",
      opening: "opening",
      light: "light",
    },
  },
  es: {
    documentTitle: "Circulo cromatico spray",
    topbarEyebrow: "Catalogo multi-fabricantes",
    topbarTitle: "Circulo cromatico spray",
    controlMenuEyebrow: "Navegacion",
    controlMenuTitle: "Menu",
    controlMenuOpen: "Abrir menu",
    controlMenuClose: "Cerrar menu",
    languageLabel: "Idioma de referencia",
    algorithmsLabel: "Algoritmos",
    manufacturersLabel: "Fabricantes",
    baseControlsLabel: "Elegir color base",
    hexLabel: "HEX",
    hueLabel: "Tono",
    saturationLabel: "Saturacion",
    lightnessLabel: "Luminosidad",
    imageLabel: "Imagen fuente",
    imageUploadLabel: "Importar una imagen",
    imageHint: "Carga una imagen, abre la pipeta grande, haz clic en la imagen y luego guarda el color.",
    imageRemove: "Quitar",
    imageReset: "Reiniciar imagen y colores",
    imageEmpty: "No hay ninguna imagen cargada.",
    imageSampleLabel: "Color muestreado",
    imageSampleEmpty: "Elige un color en la ventana emergente para guardarlo.",
    imageSaveColor: "Guardar este color",
    imagePaletteLabel: "Paleta",
    imagePaletteEmpty: "Todavia no hay ningun color en la paleta.",
    imageActive: "Base activa",
    imagePaletteBrand: "Paleta",
    sourceImage: "color de imagen",
    imageLoadError: "No se pudo cargar esta imagen.",
    imageOpenModal: "Abrir pipeta grande",
    imageModalTitle: "Elegir un color de referencia",
    imageModalHint: "Haz clic en la imagen para tomar un color con mas precision.",
    imageModalZoomLabel: "Zoom",
    imageModalZoomOut: "Alejar",
    imageModalZoomIn: "Acercar",
    imageModalZoomReset: "Ajustar",
    imageCanvasAria: "Imagen fuente para muestrear",
    imagePreviewAria: "Vista previa de la imagen fuente",
    pickerLabel: "Elegir un spray",
    pickerPlaceholder: "Loop, Montana, codigo, nombre",
    wheelEyebrow: "Crear",
    wheelGuideLabel: "Leer la rueda",
    showWheelGuide: "Entender la rueda",
    hideWheelGuide: "Ocultar ayuda",
    wheelLegendHue: "Alrededor = tono",
    wheelLegendCenter: "Centro = desaturado",
    wheelLegendEdge: "Borde = saturado",
    wheelLegendLightness: "Luminosidad separada · L {lightness}",
    wheelGuideCopy:
      "La distancia al centro muestra la fuerza cromatica, no si el color es claro u oscuro. Por eso sprays claros y oscuros pueden quedar en el mismo radio.",
    wheelGuideStepAngleTitle: "Alrededor: cambiar de familia",
    wheelGuideStepAngleCopy:
      "Cuando giras alrededor del circulo, cambias sobre todo de tono: rojo, naranja, verde, azul.",
    wheelGuideStepRadiusTitle: "Hacia el borde: mas presencia",
    wheelGuideStepRadiusCopy:
      "Al ir hacia el borde, el color se vuelve mas vivo y saturado. Hacia el centro, se vuelve mas apagado y gris.",
    wheelGuideStepLightnessTitle: "Claro u oscuro: aparte",
    wheelGuideStepLightnessCopy:
      "La luminosidad actual es {lightness}. Se ajusta con el control de Luminosidad o con el HEX, no con la distancia al centro.",
    paletteEyebrow: "Paleta",
    paletteTitle: "Seleccion de sprays",
    cartLabel: "Carrito de sprays",
    cartCopy: "Haz clic en una referencia de Seleccion de sprays para anadirla aqui.",
    copyHexAction: "Copiar HEX",
    copyReferenceAction: "Copiar ref",
    copiedAction: "Copiado",
    copyFailed: "No se pudo copiar este valor.",
    stayInTouch: "Sigamos en contacto",
    clear: "Vaciar",
    addToPalette: "Anadir a la paleta",
    inPalette: "En la paleta",
    cartActionLabel: "Carrito",
    removeAction: "Quitar",
    cartEmptyAction: "Vaciar carrito",
    close: "Cerrar",
    downloadPrintable: "Descargar ficha imprimible",
    tooltipPrinciple: "Principio",
    tooltipConstruction: "Construccion",
    tooltipUsage: "Uso graffiti",
    tooltipActivateTheory: "Activar {theory}",
    printAppName: "Circulo cromatico spray",
    printTitle: "Seleccion de sprays",
    printHtmlTitle: "Seleccion de sprays",
    printGeneratedOn: "Generado el {date}",
    printButton: "Imprimir",
    errorLoadingTitle: "Error de carga",
    errorLoadingApp: "No se pudo cargar la aplicacion.",
    manifestLoadError: "No se pudo cargar el manifiesto de fabricantes.",
    noManufacturersDeclared: "No hay ningun fabricante declarado en manufacturers/index.json.",
    catalogLoadError: "No se pudo cargar el catalogo {name}.",
    noColorsLoaded: "No se cargo ningun color.",
    runViaServer: "Inicia la app mediante un servidor HTTP local para cargar los archivos JSON.",
    presetAll: "Todos",
    presetBoth: "Los dos",
    presetOnly: "solo {brand}",
    customBrand: "Personalizado",
    baseColorName: "Color base",
    baseReferenceLabel: "Referencia base",
    chromaticRequired:
      "requiere un tono cromatico. Aumenta la saturacion o usa una regla de variacion.",
    reference: "Referencia",
    sourceColor: "color fuente",
    freeBase: "base libre",
    baseTitle: "Base",
    noActiveAlgorithmShort: "Ningun algoritmo activo.",
    noSearchResult: "No se encontro ningun spray para esta busqueda.",
    emptyCart: "El carrito esta vacio. Anade referencias desde Seleccion de sprays.",
    baseAloneTitle: "Solo base",
    zeroAlgorithm: "0 algoritmos",
    activateAlgorithms: "Activa uno o varios algoritmos para proyectar paletas sobre la rueda.",
    blockedAlgorithmsTitle: "Algoritmos bloqueados",
    blockedAlgorithmsDescription:
      "Los algoritmos seleccionados estan activos, pero el color base actual no puede producir salidas validas.",
    overlaidRulesDescription:
      "Las reglas seleccionadas se superponen en la rueda y se calculan coincidencias de fabricantes para cada salida.",
    sourcePrefix: "Fuente {source}",
    sourceCustom: "Fuente libre",
    noActiveWheelNote: "Ningun algoritmo activo. La rueda solo muestra el color base.",
    blockedLabel: "bloqueado",
    expandResults: "Detalles",
    collapseResults: "Plegar",
    basePrefix: "Base {hex} · {description}",
    add: "Anadir",
    useAsBase: "Usar",
    noDerivedOutput: "No hay salida derivada para esta regla.",
    helpAria: "Ayuda {theory}",
    wheelAria: "Circulo cromatico interactivo",
    quantityLabel: "Cantidad: {count}",
    quantityAria: "Cantidad {title}",
    count: {
      sprayColor: { one: "{count} color spray", other: "{count} colores spray" },
      manufacturer: { one: "{count} fabricante", other: "{count} fabricantes" },
      algorithm: { one: "{count} algoritmo", other: "{count} algoritmos" },
      activeAlgorithm: { one: "{count} algoritmo activo", other: "{count} algoritmos activos" },
      sprayInCart: { one: "{count} spray en el carrito", other: "{count} sprays en el carrito" },
      reference: { one: "{count} referencia", other: "{count} referencias" },
      spray: { one: "{count} spray", other: "{count} sprays" },
      block: { one: "{count} bloque", other: "{count} bloques" },
      color: { one: "{count} color", other: "{count} colores" },
      selection: { one: "{count} seleccion", other: "{count} selecciones" },
    },
    units: {
      degree: "grados",
      white: "blanco",
      black: "negro",
      gray: "gris",
    },
    generated: {
      strongShadow: "sombra fuerte",
      support: "apoyo",
      opening: "apertura",
      light: "luz",
    },
  },
  pt: {
    documentTitle: "Circulo cromatico spray",
    topbarEyebrow: "Catalogo multi-fabricantes",
    topbarTitle: "Circulo cromatico spray",
    controlMenuEyebrow: "Navegacao",
    controlMenuTitle: "Menu",
    controlMenuOpen: "Abrir menu",
    controlMenuClose: "Fechar menu",
    languageLabel: "Idioma de referencia",
    algorithmsLabel: "Algoritmos",
    manufacturersLabel: "Fabricantes",
    baseControlsLabel: "Escolher cor base",
    hexLabel: "HEX",
    hueLabel: "Matiz",
    saturationLabel: "Saturacao",
    lightnessLabel: "Luminosidade",
    imageLabel: "Imagem fonte",
    imageUploadLabel: "Importar uma imagem",
    imageHint: "Carrega uma imagem, abre a pipeta grande, clica na imagem e depois guarda a cor.",
    imageRemove: "Remover",
    imageReset: "Repor imagem e cores",
    imageEmpty: "Nenhuma imagem carregada.",
    imageSampleLabel: "Cor amostrada",
    imageSampleEmpty: "Escolhe uma cor na pop-in para a guardar.",
    imageSaveColor: "Guardar esta cor",
    imagePaletteLabel: "Paleta",
    imagePaletteEmpty: "Ainda nao existe nenhuma cor na paleta.",
    imageActive: "Base ativa",
    imagePaletteBrand: "Paleta",
    sourceImage: "cor da imagem",
    imageLoadError: "Nao foi possivel carregar esta imagem.",
    imageOpenModal: "Abrir pipeta grande",
    imageModalTitle: "Escolher uma cor de referencia",
    imageModalHint: "Clica na imagem para amostrar uma cor com mais precisao.",
    imageModalZoomLabel: "Zoom",
    imageModalZoomOut: "Reduzir zoom",
    imageModalZoomIn: "Aumentar zoom",
    imageModalZoomReset: "Ajustar",
    imageCanvasAria: "Imagem fonte para amostrar",
    imagePreviewAria: "Pre-visualizacao da imagem fonte",
    pickerLabel: "Escolher um spray",
    pickerPlaceholder: "Loop, Montana, codigo, nome",
    wheelEyebrow: "Criacao",
    wheelGuideLabel: "Ler a roda",
    showWheelGuide: "Entender a roda",
    hideWheelGuide: "Ocultar ajuda",
    wheelLegendHue: "A volta = matiz",
    wheelLegendCenter: "Centro = dessaturado",
    wheelLegendEdge: "Borda = saturado",
    wheelLegendLightness: "Luminosidade separada · L {lightness}",
    wheelGuideCopy:
      "A distancia ao centro mostra a forca cromatica, nao se a cor e clara ou escura. Por isso sprays claros e escuros podem ficar no mesmo raio.",
    wheelGuideStepAngleTitle: "A volta: mudar de familia",
    wheelGuideStepAngleCopy:
      "Quando andas a volta do circulo, mudas sobretudo o matiz: vermelho, laranja, verde, azul.",
    wheelGuideStepRadiusTitle: "Para a borda: mais presenca",
    wheelGuideStepRadiusCopy:
      "Ao ir para a borda, a cor fica mais viva e saturada. Para o centro, fica mais apagada e mais cinzenta.",
    wheelGuideStepLightnessTitle: "Claro ou escuro: separado",
    wheelGuideStepLightnessCopy:
      "A luminosidade atual e {lightness}. Ajusta-se com o controlo de Luminosidade ou com o HEX, nao com a distancia ao centro.",
    paletteEyebrow: "Paleta",
    paletteTitle: "Selecao de sprays",
    cartLabel: "Carrinho de sprays",
    cartCopy: "Clica numa referencia em Selecao de sprays para a adicionares aqui.",
    copyHexAction: "Copiar HEX",
    copyReferenceAction: "Copiar ref",
    copiedAction: "Copiado",
    copyFailed: "Nao foi possivel copiar este valor.",
    stayInTouch: "Vamos manter contacto",
    clear: "Esvaziar",
    addToPalette: "Adicionar a paleta",
    inPalette: "Na paleta",
    cartActionLabel: "Carrinho",
    removeAction: "Remover",
    cartEmptyAction: "Esvaziar carrinho",
    close: "Fechar",
    downloadPrintable: "Descarregar ficha imprimivel",
    tooltipPrinciple: "Principio",
    tooltipConstruction: "Construcao",
    tooltipUsage: "Uso graffiti",
    tooltipActivateTheory: "Ativar {theory}",
    printAppName: "Circulo cromatico spray",
    printTitle: "Selecao de sprays",
    printHtmlTitle: "Selecao de sprays",
    printGeneratedOn: "Gerado em {date}",
    printButton: "Imprimir",
    errorLoadingTitle: "Erro de carregamento",
    errorLoadingApp: "Nao foi possivel carregar a aplicacao.",
    manifestLoadError: "Nao foi possivel carregar o manifesto de fabricantes.",
    noManufacturersDeclared: "Nao existe nenhum fabricante declarado em manufacturers/index.json.",
    catalogLoadError: "Nao foi possivel carregar o catalogo {name}.",
    noColorsLoaded: "Nao foi carregada nenhuma cor.",
    runViaServer: "Inicia a app por um servidor HTTP local para carregar os ficheiros JSON.",
    presetAll: "Todos",
    presetBoth: "Os dois",
    presetOnly: "so {brand}",
    customBrand: "Personalizado",
    baseColorName: "Cor base",
    baseReferenceLabel: "Referencia base",
    chromaticRequired:
      "requer um matiz cromatico. Aumenta a saturacao ou usa uma regra de variacao.",
    reference: "Referencia",
    sourceColor: "cor de origem",
    freeBase: "base livre",
    baseTitle: "Base",
    noActiveAlgorithmShort: "Nenhum algoritmo ativo.",
    noSearchResult: "Nenhum spray encontrado para esta pesquisa.",
    emptyCart: "O carrinho esta vazio. Adiciona referencias a partir de Selecao de sprays.",
    baseAloneTitle: "So base",
    zeroAlgorithm: "0 algoritmos",
    activateAlgorithms: "Ativa um ou mais algoritmos para projetar paletas na roda.",
    blockedAlgorithmsTitle: "Algoritmos bloqueados",
    blockedAlgorithmsDescription:
      "Os algoritmos selecionados estao ativos, mas a cor base atual nao consegue produzir saidas validas.",
    overlaidRulesDescription:
      "As regras selecionadas sobrepoem-se na roda, e sao calculadas correspondencias de fabricantes para cada saida.",
    sourcePrefix: "Fonte {source}",
    sourceCustom: "Fonte livre",
    noActiveWheelNote: "Nenhum algoritmo ativo. A roda mostra apenas a cor base.",
    blockedLabel: "bloqueado",
    expandResults: "Detalhes",
    collapseResults: "Recolher",
    basePrefix: "Base {hex} · {description}",
    add: "Adicionar",
    useAsBase: "Usar",
    noDerivedOutput: "Sem saida derivada para esta regra.",
    helpAria: "Ajuda {theory}",
    wheelAria: "Circulo cromatico interativo",
    quantityLabel: "Quantidade: {count}",
    quantityAria: "Quantidade {title}",
    count: {
      sprayColor: { one: "{count} cor spray", other: "{count} cores spray" },
      manufacturer: { one: "{count} fabricante", other: "{count} fabricantes" },
      algorithm: { one: "{count} algoritmo", other: "{count} algoritmos" },
      activeAlgorithm: { one: "{count} algoritmo ativo", other: "{count} algoritmos ativos" },
      sprayInCart: { one: "{count} spray no carrinho", other: "{count} sprays no carrinho" },
      reference: { one: "{count} referencia", other: "{count} referencias" },
      spray: { one: "{count} spray", other: "{count} sprays" },
      block: { one: "{count} bloco", other: "{count} blocos" },
      color: { one: "{count} cor", other: "{count} cores" },
      selection: { one: "{count} selecao", other: "{count} selecoes" },
    },
    units: {
      degree: "graus",
      white: "branco",
      black: "preto",
      gray: "cinzento",
    },
    generated: {
      strongShadow: "sombra forte",
      support: "apoio",
      opening: "abertura",
      light: "luz",
    },
  },
};

const THEORY_SECTION_LABELS = {
  "core-harmonies": {
    fr: "Harmonies",
    de: "Harmonien",
    en: "Harmonies",
    es: "Armonias",
    pt: "Harmonias",
  },
  "core-variations": {
    fr: "Variations",
    de: "Variationen",
    en: "Variations",
    es: "Variaciones",
    pt: "Variacoes",
  },
  "adobe-extras": {
    fr: "Adobe / Photoshop",
    de: "Adobe / Photoshop",
    en: "Adobe / Photoshop",
    es: "Adobe / Photoshop",
    pt: "Adobe / Photoshop",
  },
};

const THEORY_REFERENCE_ALIASES = {
  "tints-shades": ["Tints / shades"],
};

const THEORY_LOCALIZATIONS = {
  complementary: {
    label: { fr: "Complementaire", de: "Komplementaer", en: "Complementary", es: "Complementario", pt: "Complementar" },
    formula: { fr: "0 / +180", de: "0 / +180", en: "0 / +180", es: "0 / +180", pt: "0 / +180" },
    description: {
      fr: "Deux points opposes sur la roue. C'est le contraste le plus direct et le plus energique.",
      de: "Zwei gegenueberliegende Punkte auf dem Rad. Das ist der direkteste und kraeftigste Kontrast.",
      en: "Two opposite points on the wheel. This is the most direct and energetic contrast.",
      es: "Dos puntos opuestos en la rueda. Es el contraste mas directo y energico.",
      pt: "Dois pontos opostos na roda. E o contraste mais direto e energico.",
    },
    tooltip: {
      summary: {
        fr: "Deux couleurs opposees sur la roue pour obtenir un contraste fort et immediat.",
        de: "Zwei gegenueberliegende Farben auf dem Rad fuer einen starken, direkten Kontrast.",
        en: "Two opposite colors on the wheel for a strong, immediate contrast.",
        es: "Dos colores opuestos en la rueda para lograr un contraste fuerte e inmediato.",
        pt: "Duas cores opostas na roda para obter um contraste forte e imediato.",
      },
      construction: {
        fr: "Base + couleur a 180 deg. L'app conserve une saturation utile et une luminosite proche de la base.",
        de: "Basis + Farbe bei 180 Grad. Die App behaelt eine brauchbare Saettigung und eine aehnliche Helligkeit.",
        en: "Base + color at 180 degrees. The app keeps useful saturation and similar lightness.",
        es: "Base + color a 180 grados. La app mantiene una saturacion util y una luminosidad cercana.",
        pt: "Base + cor a 180 graus. A app mantem uma saturacao util e uma luminosidade proxima.",
      },
      usage: {
        fr: "Utilise-le pour separer fill et outline, faire sortir la face principale du mur, ou opposer face et 3D. Mixe-le avec Tint pour les eclats et Shade pour l'ombre portee.",
        de: "Nutze es, um Fill und Outline zu trennen, die Front vom Mauerwerk abzusetzen oder Front und 3D gegeneinander zu stellen. Mit Tint fuer Lichtakzente und Shade fuer Schlagschatten kombinieren.",
        en: "Use it to split fill and outline, push the front face off the wall, or oppose the front and the 3D. Pair it with Tint for highlights and Shade for cast shadows.",
        es: "Usalo para separar relleno y outline, despegar la cara principal del muro o contraponer cara y 3D. Combinado con Tint para brillos y Shade para sombra proyectada funciona muy bien.",
        pt: "Usa-o para separar fill e outline, destacar a face principal do muro ou opor face e 3D. Combina-o com Tint para brilhos e Shade para sombra projetada.",
      },
    },
  },
  "split-complementary": {
    label: { fr: "Complementaire scindee", de: "Geteilte Komplementaer", en: "Split complementary", es: "Complementario dividido", pt: "Complementar dividido" },
    formula: { fr: "0 / +150 / +210", de: "0 / +150 / +210", en: "0 / +150 / +210", es: "0 / +150 / +210", pt: "0 / +150 / +210" },
    description: {
      fr: "La tension du complementaire, mais ecartee en deux voisins pour garder plus de souplesse.",
      de: "Die Spannung des Komplementaers, aber auf zwei Nachbarn verteilt fuer mehr Spielraum.",
      en: "The tension of complementary color, split into two neighbors for more flexibility.",
      es: "La tension del complementario, dividida en dos vecinos para ganar flexibilidad.",
      pt: "A tensao do complementar, dividida em dois vizinhos para ganhar flexibilidade.",
    },
    tooltip: {
      summary: {
        fr: "Une base contrastee, mais plus souple qu'un vrai complementaire.",
        de: "Eine kontrastreiche Basis, aber weicher als ein echtes Komplementaer.",
        en: "A contrasted base that feels softer than a pure complementary pair.",
        es: "Una base contrastada, pero mas flexible que un complementario puro.",
        pt: "Uma base contrastada, mas mais flexivel do que um complementar puro.",
      },
      construction: {
        fr: "Base + deux voisines du complement, ici +150 deg et +210 deg.",
        de: "Basis + zwei Nachbarn der Komplementfarbe, hier +150 Grad und +210 Grad.",
        en: "Base + the two neighbors of the complement, here +150 and +210 degrees.",
        es: "Base + los dos vecinos del complementario, aqui +150 y +210 grados.",
        pt: "Base + os dois vizinhos do complementar, aqui +150 e +210 graus.",
      },
      usage: {
        fr: "Tres bon pour un fill principal avec un inline et un outline plus souples qu'un vrai complementaire. Mixe-le avec Tone pour calmer le fond sans perdre la tension.",
        de: "Sehr gut fuer einen Haupt-Fill mit Inline und Outline, die weicher wirken als ein echtes Komplementaer. Mit Tone beruhigst du den Hintergrund, ohne die Spannung zu verlieren.",
        en: "Great for a main fill with an inline and outline that feel softer than a pure complementary hit. Mix it with Tone to calm the background without losing tension.",
        es: "Muy util para un relleno principal con inline y outline mas flexibles que un complementario puro. Mezclalo con Tone para calmar el fondo sin perder tension.",
        pt: "Muito bom para um fill principal com inline e outline mais suaves do que um complementar puro. Mistura-o com Tone para acalmar o fundo sem perder tensao.",
      },
    },
  },
  analogous: {
    label: { fr: "Analogues", de: "Analoge", en: "Analogous", es: "Analogos", pt: "Analogas" },
    formula: { fr: "0 / -30 / +30", de: "0 / -30 / +30", en: "0 / -30 / +30", es: "0 / -30 / +30", pt: "0 / -30 / +30" },
    description: {
      fr: "Deux voisines proches de la couleur de base. Une harmonie fluide, utile pour des transitions.",
      de: "Zwei nahe Nachbarn der Basisfarbe. Eine fliessende Harmonie fuer sanfte Uebergaenge.",
      en: "Two close neighbors around the base color. A fluid harmony that works well for transitions.",
      es: "Dos vecinos cercanos al color base. Una armonia fluida, util para transiciones.",
      pt: "Dois vizinhos proximos da cor base. Uma harmonia fluida, util para transicoes.",
    },
    tooltip: {
      summary: {
        fr: "Une famille de couleurs voisines, donc tres coherente visuellement.",
        de: "Eine Familie benachbarter Farben und deshalb sehr geschlossen im Bild.",
        en: "A family of neighboring colors, which creates strong visual coherence.",
        es: "Una familia de colores vecinos, muy coherente a nivel visual.",
        pt: "Uma familia de cores vizinhas, muito coerente visualmente.",
      },
      construction: {
        fr: "Base + voisins proches sur la roue, ici -30 deg et +30 deg.",
        de: "Basis + nahe Nachbarn auf dem Rad, hier -30 Grad und +30 Grad.",
        en: "Base + nearby neighbors on the wheel, here -30 and +30 degrees.",
        es: "Base + vecinos cercanos en la rueda, aqui -30 y +30 grados.",
        pt: "Base + vizinhos proximos na roda, aqui -30 e +30 graus.",
      },
      usage: {
        fr: "Parfait pour des fades, des remplissages fluides, des fonds brumeux ou une piece ton sur ton. Ajoute ensuite un Complementaire ou un Accented analogous pour faire claquer le contour.",
        de: "Perfekt fuer Fades, fluessige Fills, neblige Hintergruende oder ein Ton-in-Ton-Piece. Fuege danach Complementary oder Accented analogous hinzu, damit der Outline knallt.",
        en: "Perfect for fades, fluid fills, hazy backgrounds, or a tone-on-tone piece. Then add Complementary or Accented analogous if you want the outline to snap harder.",
        es: "Perfecto para fades, rellenos fluidos, fondos brumosos o una pieza tono sobre tono. Luego anade Complementary o Accented analogous para que el contorno pegue mas.",
        pt: "Perfeito para fades, fills fluidos, fundos nebulosos ou uma piece tom sobre tom. Depois junta Complementary ou Accented analogous para fazer o contorno bater mais forte.",
      },
    },
  },
  "accented-analogous": {
    label: { fr: "Analogues accentuees", de: "Betonte Analoge", en: "Accented analogous", es: "Analogos acentuados", pt: "Analogas acentuadas" },
    formula: { fr: "0 / -30 / +30 / +180", de: "0 / -30 / +30 / +180", en: "0 / -30 / +30 / +180", es: "0 / -30 / +30 / +180", pt: "0 / -30 / +30 / +180" },
    description: {
      fr: "Une base analogique a laquelle on ajoute son opposee pour injecter un accent de contraste.",
      de: "Eine analoge Basis, der ein Gegenpol fuer einen klaren Akzent hinzugefuegt wird.",
      en: "An analogous base with its opposite added to create a contrasting accent.",
      es: "Una base analoga a la que se anade su opuesto para introducir un acento de contraste.",
      pt: "Uma base analoga com o oposto adicionado para criar um acento de contraste.",
    },
    tooltip: {
      summary: {
        fr: "Une base analogique a laquelle on ajoute un contrepoint plus contraste.",
        de: "Eine analoge Basis, der ein kontrastreicher Gegenpunkt hinzugefuegt wird.",
        en: "An analogous base with one more contrasted counterpoint.",
        es: "Una base analoga a la que se anade un contrapunto mas contrastado.",
        pt: "Uma base analoga com um contraponto mais contrastado.",
      },
      construction: {
        fr: "Analogues autour de la base, puis un accent oppose a +180 deg.",
        de: "Analoge Farben um die Basis und danach ein Gegenakzent bei +180 Grad.",
        en: "Analog colors around the base, plus one opposite accent at +180 degrees.",
        es: "Colores analogos alrededor de la base y un acento opuesto a +180 grados.",
        pt: "Cores analogas em volta da base e um acento oposto a +180 graus.",
      },
      usage: {
        fr: "Ideal pour un fill analogue propre, avec une seule couleur opposee pour l'inline, les fleches ou un detail de personnage. Bon mix si tu veux une piece lisible avec juste un coup de poing final.",
        de: "Ideal fuer einen sauberen analogen Fill mit nur einer Gegenfarbe fuer Inline, Pfeile oder ein Character-Detail. Gute Mischung fuer ein lesbares Piece mit nur einem finalen Schlag.",
        en: "Ideal for a clean analogous fill with one opposite color reserved for the inline, arrows, or a character detail. A strong mix when you want readability plus one final punch.",
        es: "Ideal para un fill analogo limpio con un solo color opuesto para el inline, las flechas o un detalle del personaje. Muy bueno si buscas una pieza legible con un golpe final.",
        pt: "Ideal para um fill analogo limpo com uma unica cor oposta para o inline, setas ou um detalhe de character. Muito bom se queres uma piece legivel com um ultimo golpe forte.",
      },
    },
  },
  triadic: {
    label: { fr: "Triadique", de: "Triadisch", en: "Triadic", es: "Triadico", pt: "Triadico" },
    formula: { fr: "0 / +120 / +240", de: "0 / +120 / +240", en: "0 / +120 / +240", es: "0 / +120 / +240", pt: "0 / +120 / +240" },
    description: {
      fr: "Trois points equidistants. Une harmonie tres structuree qui garde de la tension.",
      de: "Drei gleich verteilte Punkte. Eine strukturierte Harmonie, die Spannung behaelt.",
      en: "Three evenly spaced points. A structured harmony that still keeps tension.",
      es: "Tres puntos equidistantes. Una armonia muy estructurada que mantiene tension.",
      pt: "Tres pontos equidistantes. Uma harmonia estruturada que mantem tensao.",
    },
    tooltip: {
      summary: {
        fr: "Trois points equidistants qui donnent une palette vive et bien repartie.",
        de: "Drei gleichmaessig verteilte Punkte fuer eine lebendige, ausgewogene Palette.",
        en: "Three evenly spaced points that create a vivid, balanced palette.",
        es: "Tres puntos equidistantes que crean una paleta viva y equilibrada.",
        pt: "Tres pontos equidistantes que criam uma paleta viva e equilibrada.",
      },
      construction: {
        fr: "Base + deux points a +120 deg et +240 deg.",
        de: "Basis + zwei Punkte bei +120 Grad und +240 Grad.",
        en: "Base + two points at +120 and +240 degrees.",
        es: "Base + dos puntos a +120 y +240 grados.",
        pt: "Base + dois pontos a +120 e +240 graus.",
      },
      usage: {
        fr: "Tres utile pour repartir les roles entre fill, 3D et fond, ou fill, personnage et details. Si c'est trop bruyant, garde une couleur dominante et ouvre les deux autres avec Tint ou Tone.",
        de: "Sehr nuetzlich, um Rollen zwischen Fill, 3D und Hintergrund oder zwischen Fill, Character und Details zu verteilen. Wenn es zu laut wird, lass eine Farbe dominieren und oeffne die anderen mit Tint oder Tone.",
        en: "Very useful for splitting roles between fill, 3D, and background, or fill, character, and details. If it gets too loud, keep one dominant color and soften the other two with Tint or Tone.",
        es: "Muy util para repartir roles entre fill, 3D y fondo, o entre fill, personaje y detalles. Si queda demasiado ruidoso, deja un color dominante y abre los otros dos con Tint o Tone.",
        pt: "Muito util para repartir funcoes entre fill, 3D e fundo, ou entre fill, character e detalhes. Se ficar demasiado ruidoso, deixa uma cor dominante e abre as outras duas com Tint ou Tone.",
      },
    },
  },
  tetradic: {
    label: { fr: "Tetradique", de: "Tetradisch", en: "Tetradic", es: "Tetradico", pt: "Tetradico" },
    formula: { fr: "0 / +60 / +180 / +240", de: "0 / +60 / +180 / +240", en: "0 / +60 / +180 / +240", es: "0 / +60 / +180 / +240", pt: "0 / +60 / +180 / +240" },
    description: {
      fr: "Un rectangle sur la roue. Plus riche qu'une triade, avec deux couples de tensions.",
      de: "Ein Rechteck auf dem Rad. Reicher als eine Triade, mit zwei Spannungs-Paaren.",
      en: "A rectangle on the wheel. Richer than a triad, with two pairs of tension.",
      es: "Un rectangulo en la rueda. Mas rico que una triada, con dos pares de tension.",
      pt: "Um retangulo na roda. Mais rico do que uma triade, com dois pares de tensao.",
    },
    tooltip: {
      summary: {
        fr: "Une palette a quatre points basee sur un rectangle chromatique.",
        de: "Eine Vierpunkt-Palette auf Basis eines chromatischen Rechtecks.",
        en: "A four-point palette built from a chromatic rectangle.",
        es: "Una paleta de cuatro puntos basada en un rectangulo cromatico.",
        pt: "Uma paleta de quatro pontos baseada num retangulo cromatico.",
      },
      construction: {
        fr: "Base + 3 points a +60 deg, +180 deg et +240 deg.",
        de: "Basis + drei Punkte bei +60 Grad, +180 Grad und +240 Grad.",
        en: "Base + three points at +60, +180, and +240 degrees.",
        es: "Base + tres puntos a +60, +180 y +240 grados.",
        pt: "Base + tres pontos a +60, +180 e +240 graus.",
      },
      usage: {
        fr: "Pense-le comme une prod complete: fill, 3D, background et petits accents. Ca marche si une seule couleur mene le jeu et si tu mets les autres en retrait avec Tone ou des valeurs plus claires.",
        de: "Denk es wie eine ganze Produktion: Fill, 3D, Background und kleine Akzente. Es funktioniert, wenn eine Farbe fuehrt und die anderen mit Tone oder helleren Werten zurueckgenommen werden.",
        en: "Treat it like a full production: fill, 3D, background, and small accents. It works when one color leads and the others are pushed back with Tone or lighter values.",
        es: "Piensalo como una produccion completa: fill, 3D, fondo y pequenos acentos. Funciona si un color manda y los demas quedan atras con Tone o valores mas claros.",
        pt: "Pensa nisto como uma producao completa: fill, 3D, fundo e pequenos acentos. Funciona se uma cor liderar e as outras ficarem atras com Tone ou valores mais claros.",
      },
    },
  },
  square: {
    label: { fr: "Carre", de: "Quadrat", en: "Square", es: "Cuadrado", pt: "Quadrado" },
    formula: { fr: "0 / +90 / +180 / +270", de: "0 / +90 / +180 / +270", en: "0 / +90 / +180 / +270", es: "0 / +90 / +180 / +270", pt: "0 / +90 / +180 / +270" },
    description: {
      fr: "Quatre points a distance egale. Le systeme le plus equilibre pour une palette vive.",
      de: "Vier gleich weit entfernte Punkte. Das ausgewogenste System fuer eine lebhafte Palette.",
      en: "Four evenly spaced points. The most balanced system for a vivid palette.",
      es: "Cuatro puntos equidistantes. El sistema mas equilibrado para una paleta viva.",
      pt: "Quatro pontos equidistantes. O sistema mais equilibrado para uma paleta viva.",
    },
    tooltip: {
      summary: {
        fr: "Quatre couleurs a distance egale pour une palette tres tendue mais reguliere.",
        de: "Vier gleich entfernte Farben fuer eine sehr gespannte, aber regelmaessige Palette.",
        en: "Four evenly spaced colors for a tense but regular palette.",
        es: "Cuatro colores a la misma distancia para una paleta tensa pero regular.",
        pt: "Quatro cores a igual distancia para uma paleta tensa mas regular.",
      },
      construction: {
        fr: "Base + 3 points a +90 deg, +180 deg et +270 deg.",
        de: "Basis + drei Punkte bei +90 Grad, +180 Grad und +270 Grad.",
        en: "Base + three points at +90, +180, and +270 degrees.",
        es: "Base + tres puntos a +90, +180 y +270 grados.",
        pt: "Base + tres pontos a +90, +180 e +270 graus.",
      },
      usage: {
        fr: "A garder pour des pieces pop, comics, posters ou des murs tres graphiques. Choisis un duo vif pour le fill et l'outline, puis calme les deux autres points avec Tone ou Vivid / muted.",
        de: "Gut fuer poppige, comicartige oder sehr grafische Pieces. Waehle ein kraeftiges Duo fuer Fill und Outline und beruhige die zwei anderen Punkte mit Tone oder Vivid / muted.",
        en: "Keep it for pop, comic, poster-like, or very graphic pieces. Pick one vivid pair for fill and outline, then calm the other two points with Tone or Vivid / muted.",
        es: "Reservalo para piezas pop, comic, poster o muros muy graficos. Elige un duo vivo para fill y outline, y calma los otros dos puntos con Tone o Vivid / muted.",
        pt: "Guarda-o para pieces pop, comic, poster ou muros muito graficos. Escolhe um duo vivo para fill e outline e acalma os outros dois pontos com Tone ou Vivid / muted.",
      },
    },
  },
  "double-split-complementary": {
    label: { fr: "Double complementaire scindee", de: "Doppelt geteilte Komplementaer", en: "Double split complementary", es: "Doble complementario dividido", pt: "Duplo complementar dividido" },
    formula: { fr: "0 / -30 / +30 / +150 / +210", de: "0 / -30 / +30 / +150 / +210", en: "0 / -30 / +30 / +150 / +210", es: "0 / -30 / +30 / +150 / +210", pt: "0 / -30 / +30 / +150 / +210" },
    description: {
      fr: "Deux voisins autour de la base et deux voisins autour de son opposee pour une palette plus large.",
      de: "Zwei Nachbarn um die Basis und zwei um ihren Gegenpol fuer eine breitere Palette.",
      en: "Two neighbors around the base and two around its opposite for a broader palette.",
      es: "Dos vecinos alrededor de la base y dos alrededor de su opuesto para una paleta mas amplia.",
      pt: "Dois vizinhos em volta da base e dois em volta do oposto para uma paleta mais ampla.",
    },
    tooltip: {
      summary: {
        fr: "Une palette large qui combine voisins de la base et voisins de son opposee.",
        de: "Eine breite Palette, die Nachbarn der Basis und ihres Gegenpols kombiniert.",
        en: "A broad palette that combines neighbors of the base and neighbors of its opposite.",
        es: "Una paleta amplia que combina vecinos de la base y del color opuesto.",
        pt: "Uma paleta ampla que combina vizinhos da base e do seu oposto.",
      },
      construction: {
        fr: "Base + -30 deg, +30 deg, +150 deg et +210 deg.",
        de: "Basis + -30 Grad, +30 Grad, +150 Grad und +210 Grad.",
        en: "Base + -30, +30, +150, and +210 degrees.",
        es: "Base + -30, +30, +150 y +210 grados.",
        pt: "Base + -30, +30, +150 e +210 graus.",
      },
      usage: {
        fr: "Tres bon pour une grosse prod: une famille sert au fill et a la 3D, l'autre au fond et aux details. Ensuite, sers-toi de Tint et Shade pour hierarchiser sans perdre la logique du set.",
        de: "Sehr gut fuer eine grosse Produktion: Eine Familie dient Fill und 3D, die andere Hintergrund und Details. Danach helfen Tint und Shade, alles zu staffeln, ohne die Logik des Sets zu verlieren.",
        en: "Very good for a bigger production: one family can handle fill and 3D, the other background and details. Then use Tint and Shade to create hierarchy without losing the palette logic.",
        es: "Muy bueno para una produccion grande: una familia sirve para fill y 3D, la otra para fondo y detalles. Luego usa Tint y Shade para jerarquizar sin perder la logica del set.",
        pt: "Muito bom para uma producao grande: uma familia serve para fill e 3D, a outra para fundo e detalhes. Depois usa Tint e Shade para criar hierarquia sem perder a logica do set.",
      },
    },
  },
  monochromatic: {
    label: { fr: "Monochromatique", de: "Monochrom", en: "Monochromatic", es: "Monocromatico", pt: "Monocromatico" },
    formula: {
      fr: "meme teinte / valeurs changeantes",
      de: "gleicher Farbton / variable Werte",
      en: "same hue / shifting values",
      es: "mismo tono / valores variables",
      pt: "mesmo matiz / valores variaveis",
    },
    description: {
      fr: "La meme famille de teinte, en ouvrant ou en densifiant luminosite et saturation.",
      de: "Dieselbe Farbfamilie, bei der Helligkeit und Saettigung geoeffnet oder verdichtet werden.",
      en: "The same hue family, by opening or densifying lightness and saturation.",
      es: "La misma familia de tono, abriendo o densificando luminosidad y saturacion.",
      pt: "A mesma familia de matiz, abrindo ou densificando luminosidade e saturacao.",
    },
    tooltip: {
      summary: {
        fr: "Une seule teinte de base, avec plusieurs niveaux de densite et de lumiere.",
        de: "Ein einziger Grundfarbton mit mehreren Dichte- und Lichtstufen.",
        en: "A single base hue with several levels of density and light.",
        es: "Un solo tono base con varios niveles de densidad y luz.",
        pt: "Um unico matiz base com varios niveis de densidade e luz.",
      },
      construction: {
        fr: "La teinte reste fixe; on fait varier surtout la luminosite et un peu la saturation.",
        de: "Der Farbton bleibt gleich; vor allem Helligkeit und etwas Saettigung aendern sich.",
        en: "The hue stays fixed; lightness changes the most, with smaller saturation shifts.",
        es: "El tono se mantiene fijo; varia sobre todo la luminosidad y un poco la saturacion.",
        pt: "O matiz fica fixo; varia-se sobretudo a luminosidade e um pouco a saturacao.",
      },
      usage: {
        fr: "Parfait pour construire un fill propre, des volumes internes, une 3D lisible ou des ombres progressives sans quitter la meme famille. Mixe-le avec Hue shift si tu veux juste un leger mouvement chaud/froid.",
        de: "Perfekt fuer einen sauberen Fill, innere Volumen, lesbares 3D oder progressive Schatten, ohne die Farbfamilie zu verlassen. Mit Hue shift kombinieren, wenn du nur etwas warm/kalt Bewegung willst.",
        en: "Perfect for building a clean fill, internal volume, readable 3D, or progressive shadows without leaving the same family. Mix it with Hue shift if you only want a slight warm/cool movement.",
        es: "Perfecto para construir un fill limpio, volumen interno, 3D legible o sombras progresivas sin salir de la misma familia. Mezclalo con Hue shift si quieres solo un pequeno movimiento calido/frio.",
        pt: "Perfeito para construir um fill limpo, volume interno, 3D legivel ou sombras progressivas sem sair da mesma familia. Mistura-o com Hue shift se quiseres apenas um ligeiro movimento quente/frio.",
      },
    },
  },
  "hue-shift": {
    label: { fr: "Decalage de teinte", de: "Farbtonverschiebung", en: "Hue shift", es: "Desplazamiento de tono", pt: "Deslocamento de matiz" },
    formula: { fr: "-40 / -20 / +20 / +40", de: "-40 / -20 / +20 / +40", en: "-40 / -20 / +20 / +40", es: "-40 / -20 / +20 / +40", pt: "-40 / -20 / +20 / +40" },
    description: {
      fr: "Glissement de teinte sans casser la luminosite initiale. Pratique pour explorer un axe chromatique.",
      de: "Farbton-Verschiebung ohne Bruch der Grundhelligkeit. Gut zum Erkunden eines Farbachse.",
      en: "A hue slide without breaking the starting lightness. Useful for exploring a chromatic axis.",
      es: "Desplazamiento de tono sin romper la luminosidad inicial. Util para explorar un eje cromatico.",
      pt: "Deslocamento de matiz sem quebrar a luminosidade inicial. Util para explorar um eixo cromatico.",
    },
    tooltip: {
      summary: {
        fr: "Une exploration autour de la teinte de base sans changer brutalement le reste.",
        de: "Eine Erkundung rund um den Grundfarbton, ohne den Rest abrupt zu aendern.",
        en: "An exploration around the base hue without changing everything else too abruptly.",
        es: "Una exploracion alrededor del tono base sin cambiar bruscamente el resto.",
        pt: "Uma exploracao em volta do matiz base sem alterar bruscamente o resto.",
      },
      construction: {
        fr: "On decale la teinte a -40, -20, +20 et +40 deg en gardant une structure HSL proche.",
        de: "Der Farbton wird auf -40, -20, +20 und +40 Grad verschoben, bei aehnlicher HSL-Struktur.",
        en: "The hue is shifted to -40, -20, +20, and +40 degrees while keeping a similar HSL structure.",
        es: "Se desplaza el tono a -40, -20, +20 y +40 grados manteniendo una estructura HSL cercana.",
        pt: "Desloca-se o matiz para -40, -20, +20 e +40 graus mantendo uma estrutura HSL proxima.",
      },
      usage: {
        fr: "Tres utile pour un fill en mouvement, des passages chauds/froids dans une barre, ou un effet de lumiere qui glisse. Combine-le avec Monochromatique ou Tints / shades pour garder du volume.",
        de: "Sehr nuetzlich fuer einen Fill mit Bewegung, warm/kalt Uebergaenge in einer Bar oder einen gleitenden Lichteffekt. Mit Monochromatic oder Tints / shades kombinieren, um Volumen zu behalten.",
        en: "Very useful for a moving fill, warm/cool travel inside a bar, or a light effect that slides across the piece. Combine it with Monochromatic or Tints / shades to keep volume.",
        es: "Muy util para un fill con movimiento, transiciones calidas/frias dentro de una barra o un efecto de luz que se desplaza. Combinado con Monochromatic o Tints / shades mantiene el volumen.",
        pt: "Muito util para um fill com movimento, transicoes quente/frio dentro de uma barra ou um efeito de luz que desliza. Combinado com Monochromatic ou Tints / shades mantem o volume.",
      },
    },
  },
  tint: {
    label: { fr: "Eclaircissement", de: "Aufhellung", en: "Tint", es: "Aclarado", pt: "Clareamento" },
    formula: {
      fr: "+20% / +40% / +60% blanc",
      de: "+20% / +40% / +60% Weiss",
      en: "+20% / +40% / +60% white",
      es: "+20% / +40% / +60% blanco",
      pt: "+20% / +40% / +60% branco",
    },
    description: {
      fr: "Meme teinte, melangee au blanc pour obtenir des versions plus claires.",
      de: "Derselbe Farbton, mit Weiss gemischt fuer hellere Versionen.",
      en: "The same hue mixed with white to create lighter versions.",
      es: "El mismo tono mezclado con blanco para obtener versiones mas claras.",
      pt: "O mesmo matiz misturado com branco para obter versoes mais claras.",
    },
    tooltip: {
      summary: {
        fr: "Une version eclaircie de la couleur en la rapprochant du blanc.",
        de: "Eine aufgehellte Version der Farbe, die in Richtung Weiss gezogen wird.",
        en: "A lighter version of the color by moving it toward white.",
        es: "Una version aclarada del color al acercarlo al blanco.",
        pt: "Uma versao mais clara da cor ao aproxima-la do branco.",
      },
      construction: {
        fr: "On melange la base avec du blanc a 20%, 40% et 60%.",
        de: "Die Basis wird mit Weiss bei 20%, 40% und 60% gemischt.",
        en: "The base is mixed with white at 20%, 40%, and 60%.",
        es: "La base se mezcla con blanco al 20%, 40% y 60%.",
        pt: "A base e misturada com branco a 20%, 40% e 60%.",
      },
      usage: {
        fr: "Sers-t'en pour les highlights, les reflets, les bulles brillantes, les ciels ou les faces hautes d'une 3D. Le duo le plus logique reste Tint + Shade pour modeler rapidement une meme couleur.",
        de: "Nutze es fuer Highlights, Reflexe, glaenzende Bubbles, Himmel oder obere Flaechen eines 3D. Das logischste Duo ist Tint + Shade, um eine Farbe schnell zu modellieren.",
        en: "Use it for highlights, reflections, glossy bubbles, skies, or the upper planes of a 3D. The most logical pair is Tint + Shade to model one color quickly.",
        es: "Usalo para highlights, reflejos, burbujas brillantes, cielos o caras superiores de un 3D. La dupla mas logica es Tint + Shade para modelar un mismo color rapidamente.",
        pt: "Usa-o para highlights, reflexos, bubbles brilhantes, ceus ou planos superiores de um 3D. A dupla mais logica e Tint + Shade para modelar rapidamente uma mesma cor.",
      },
    },
  },
  shade: {
    label: { fr: "Ombre", de: "Abdunklung", en: "Shade", es: "Sombra", pt: "Sombra" },
    formula: {
      fr: "+20% / +40% / +60% noir",
      de: "+20% / +40% / +60% Schwarz",
      en: "+20% / +40% / +60% black",
      es: "+20% / +40% / +60% negro",
      pt: "+20% / +40% / +60% preto",
    },
    description: {
      fr: "Meme teinte, poussee vers le noir pour obtenir des profondeurs progressives.",
      de: "Derselbe Farbton, in Richtung Schwarz gezogen fuer zunehmende Tiefe.",
      en: "The same hue pushed toward black to create progressive depth.",
      es: "El mismo tono empujado hacia el negro para obtener profundidades progresivas.",
      pt: "O mesmo matiz empurrado para o preto para obter profundidades progressivas.",
    },
    tooltip: {
      summary: {
        fr: "Une version assombrie de la couleur en la rapprochant du noir.",
        de: "Eine abgedunkelte Version der Farbe, naeher an Schwarz.",
        en: "A darker version of the color by moving it toward black.",
        es: "Una version oscurecida del color al acercarlo al negro.",
        pt: "Uma versao escurecida da cor ao aproxima-la do preto.",
      },
      construction: {
        fr: "On melange la base avec du noir a 20%, 40% et 60%.",
        de: "Die Basis wird mit Schwarz bei 20%, 40% und 60% gemischt.",
        en: "The base is mixed with black at 20%, 40%, and 60%.",
        es: "La base se mezcla con negro al 20%, 40% y 60%.",
        pt: "A base e misturada com preto a 20%, 40% e 60%.",
      },
      usage: {
        fr: "Parfait pour les faces de 3D, les ombres internes, les dessous de lettres et l'ombre portee au sol ou au mur. Avec Complementaire, tu peux rendre la separation face/ombre tres theatrale.",
        de: "Perfekt fuer 3D-Flaechen, innere Schatten, Unterseiten von Buchstaben und Schlagschatten auf Boden oder Wand. Mit Complementary wird die Trennung zwischen Front und Schatten sehr theatralisch.",
        en: "Perfect for 3D faces, inner shadows, undersides of letters, and cast shadows on the wall or ground. With Complementary, you can make the face/shadow split feel very dramatic.",
        es: "Perfecto para caras de 3D, sombras internas, partes bajas de las letras y sombra proyectada en muro o suelo. Con Complementary puedes volver muy dramatica la separacion entre cara y sombra.",
        pt: "Perfeito para faces de 3D, sombras internas, partes inferiores das letras e sombra projetada no chao ou na parede. Com Complementary podes tornar a separacao entre face e sombra muito dramatica.",
      },
    },
  },
  tone: {
    label: { fr: "Ton", de: "Ton", en: "Tone", es: "Tono", pt: "Tom" },
    formula: {
      fr: "+20% / +40% / +60% gris",
      de: "+20% / +40% / +60% Grau",
      en: "+20% / +40% / +60% gray",
      es: "+20% / +40% / +60% gris",
      pt: "+20% / +40% / +60% cinzento",
    },
    description: {
      fr: "Meme teinte, rabattue vers un gris moyen pour calmer le contraste et la saturation.",
      de: "Derselbe Farbton, in Richtung Mittelgrau gezogen, um Kontrast und Saettigung zu beruhigen.",
      en: "The same hue pulled toward a medium gray to calm contrast and saturation.",
      es: "El mismo tono llevado hacia un gris medio para suavizar contraste y saturacion.",
      pt: "O mesmo matiz levado para um cinzento medio para suavizar contraste e saturacao.",
    },
    tooltip: {
      summary: {
        fr: "Une version rabattue de la couleur, moins pure et plus neutre.",
        de: "Eine gedaempfte Version der Farbe, weniger rein und neutraler.",
        en: "A muted version of the color, less pure and more neutral.",
        es: "Una version apagada del color, menos pura y mas neutra.",
        pt: "Uma versao suavizada da cor, menos pura e mais neutra.",
      },
      construction: {
        fr: "On melange la base avec un gris moyen a 20%, 40% et 60%.",
        de: "Die Basis wird mit Mittelgrau bei 20%, 40% und 60% gemischt.",
        en: "The base is mixed with medium gray at 20%, 40%, and 60%.",
        es: "La base se mezcla con un gris medio al 20%, 40% y 60%.",
        pt: "A base e misturada com um cinzento medio a 20%, 40% e 60%.",
      },
      usage: {
        fr: "Super utile pour calmer un fond, salir une couleur trop propre, ou rapprocher le set d'un mur beton, rouille ou poussiere. Mixe-le avec Vivid / muted quand tu veux gerer clairement premier plan et arriere-plan.",
        de: "Sehr nuetzlich, um einen Hintergrund zu beruhigen, eine zu saubere Farbe schmutziger zu machen oder das Set an Beton, Rost oder Staub anzugleichen. Mit Vivid / muted kombinieren, wenn Vorder- und Hintergrund klar getrennt werden sollen.",
        en: "Very useful for calming a background, dirtying up a color that feels too clean, or pushing the set toward concrete, rust, or dust. Mix it with Vivid / muted when you want a clear foreground/background split.",
        es: "Muy util para calmar un fondo, ensuciar un color demasiado limpio o acercar el set a hormigon, oxido o polvo. Mezclalo con Vivid / muted si quieres separar claramente primer plano y fondo.",
        pt: "Muito util para acalmar um fundo, sujar uma cor demasiado limpa ou aproximar o set de betao, ferrugem ou poeira. Mistura-o com Vivid / muted se quiseres separar claramente primeiro plano e fundo.",
      },
    },
  },
  compound: {
    label: { fr: "Compose", de: "Komposit", en: "Compound", es: "Compuesto", pt: "Composto" },
    formula: { fr: "0 / +30 / +180 / +210", de: "0 / +30 / +180 / +210", en: "0 / +30 / +180 / +210", es: "0 / +30 / +180 / +210", pt: "0 / +30 / +180 / +210" },
    description: {
      fr: "Regle Adobe/Photoshop melangeant analogue et complementaire. La geometrie ici est une interpretation pratique.",
      de: "Adobe/Photoshop-Regel zwischen analog und komplementaer. Die Geometrie hier ist eine praktische Interpretation.",
      en: "An Adobe/Photoshop-style rule mixing analogous and complementary behavior. The geometry here is a practical interpretation.",
      es: "Regla tipo Adobe/Photoshop que mezcla analogos y complementarios. La geometria aqui es una interpretacion practica.",
      pt: "Regra ao estilo Adobe/Photoshop que mistura analogos e complementares. A geometria aqui e uma interpretacao pratica.",
    },
    tooltip: {
      summary: {
        fr: "Une regle hybride proche des outils Adobe, entre analogique et complementaire.",
        de: "Eine hybride Regel nahe an den Adobe-Werkzeugen, zwischen analog und komplementaer.",
        en: "A hybrid rule close to Adobe tools, somewhere between analogous and complementary.",
        es: "Una regla hibrida cercana a las herramientas de Adobe, entre analogica y complementaria.",
        pt: "Uma regra hibrida proxima das ferramentas Adobe, entre analogica e complementar.",
      },
      construction: {
        fr: "Base + un voisin analogue + le complement + un voisin du complement.",
        de: "Basis + ein analoger Nachbar + das Komplement + ein Nachbar des Komplements.",
        en: "Base + one analogous neighbor + the complement + one neighbor of the complement.",
        es: "Base + un vecino analogo + el complementario + un vecino del complementario.",
        pt: "Base + um vizinho analogo + o complementar + um vizinho do complementar.",
      },
      usage: {
        fr: "Tres efficace pour une piece active: un fill vivant, un outline solide, une 3D ou un fond en opposition. Ajoute Tint sur le haut et Tone dans le decor pour garder du relief sans faire trop de bruit.",
        de: "Sehr effektiv fuer ein aktives Piece: ein lebendiger Fill, eine solide Outline, ein 3D oder ein Hintergrund im Gegenpol. Fuege oben Tint und im Umfeld Tone hinzu, damit Relief bleibt, ohne zu laut zu werden.",
        en: "Very effective for an active piece: a lively fill, a solid outline, and a contrasting 3D or background. Add Tint on top and Tone in the surroundings to keep relief without making too much noise.",
        es: "Muy eficaz para una pieza activa: un fill vivo, un outline solido y un 3D o fondo en oposicion. Anade Tint arriba y Tone en el entorno para mantener relieve sin demasiado ruido.",
        pt: "Muito eficaz para uma piece ativa: um fill vivo, um outline solido e um 3D ou fundo em oposicao. Junta Tint em cima e Tone a volta para manter relevo sem fazer demasiado ruido.",
      },
    },
  },
  shades: {
    label: { fr: "Nuances", de: "Abstufungen", en: "Shades", es: "Matices", pt: "Matizes" },
    formula: {
      fr: "meme teinte / luminosite variable",
      de: "gleicher Farbton / variable Helligkeit",
      en: "same hue / variable lightness",
      es: "mismo tono / luminosidad variable",
      pt: "mesmo matiz / luminosidade variavel",
    },
    description: {
      fr: "Regle Adobe/Photoshop basee sur des variations de luminosite d'une seule teinte.",
      de: "Adobe/Photoshop-Regel auf Basis von Helligkeitsvarianten eines einzigen Farbtons.",
      en: "An Adobe/Photoshop-style rule based on lightness variations of a single hue.",
      es: "Regla estilo Adobe/Photoshop basada en variaciones de luminosidad de un solo tono.",
      pt: "Regra ao estilo Adobe/Photoshop baseada em variacoes de luminosidade de um unico matiz.",
    },
    tooltip: {
      summary: {
        fr: "Une lecture 'valeur' d'une meme teinte, inspiree des variantes Adobe.",
        de: "Eine Werteskala derselben Farbe, inspiriert von Adobe-Varianten.",
        en: "A value-based reading of the same hue, inspired by Adobe variants.",
        es: "Una lectura por valores de un mismo tono, inspirada en variantes de Adobe.",
        pt: "Uma leitura por valores do mesmo matiz, inspirada nas variantes da Adobe.",
      },
      construction: {
        fr: "La teinte reste la meme, et on pousse surtout la luminosite vers le clair et le sombre.",
        de: "Der Farbton bleibt gleich, vor allem die Helligkeit wird nach hell und dunkel verschoben.",
        en: "The hue stays the same while lightness is pushed toward brighter and darker values.",
        es: "El tono se mantiene y se empuja sobre todo la luminosidad hacia claro y oscuro.",
        pt: "O matiz mantem-se e a luminosidade e empurrada para claro e escuro.",
      },
      usage: {
        fr: "Pense-le comme une echelle de lecture pour chrome, metal, plis, biseaux ou 3D tres lisibles. Il se marie tres bien avec Monochromatique pour garder la meme famille tout en renforcant les valeurs.",
        de: "Denk daran wie an eine Leseskala fuer Chrome, Metall, Falten, Facetten oder sehr lesbares 3D. Es passt sehr gut zu Monochromatic, wenn du in derselben Familie bleiben und die Werte verstaerken willst.",
        en: "Think of it as a reading scale for chrome, metal, folds, bevels, or very readable 3D. It works very well with Monochromatic when you want to stay in one family but strengthen the values.",
        es: "Piensalo como una escala de lectura para chrome, metal, pliegues, biseles o 3D muy legible. Se lleva muy bien con Monochromatic si quieres quedarte en una familia y reforzar los valores.",
        pt: "Pensa nisto como uma escala de leitura para chrome, metal, pregas, biselados ou um 3D muito legivel. Funciona muito bem com Monochromatic se quiseres ficar na mesma familia e reforcar os valores.",
      },
    },
  },
  pentagram: {
    label: { fr: "Pentagramme", de: "Pentagramm", en: "Pentagram", es: "Pentagrama", pt: "Pentagrama" },
    formula: { fr: "0 / +72 / +144 / +216 / +288", de: "0 / +72 / +144 / +216 / +288", en: "0 / +72 / +144 / +216 / +288", es: "0 / +72 / +144 / +216 / +288", pt: "0 / +72 / +144 / +216 / +288" },
    description: {
      fr: "Cinq points repartis regulierement sur la roue, inspire du panel Adobe de groupes de couleurs.",
      de: "Fuenf regelmaessig verteilte Punkte auf dem Rad, inspiriert vom Adobe-Panel fuer Farbgruppen.",
      en: "Five evenly spaced points on the wheel, inspired by Adobe color group tools.",
      es: "Cinco puntos repartidos regularmente en la rueda, inspirados en el panel Adobe de grupos de color.",
      pt: "Cinco pontos regularmente distribuidos na roda, inspirados no painel Adobe de grupos de cor.",
    },
    tooltip: {
      summary: {
        fr: "Cinq points regulierement repartis pour une palette tres large.",
        de: "Fuenf gleich verteilte Punkte fuer eine sehr breite Palette.",
        en: "Five evenly distributed points for a very broad palette.",
        es: "Cinco puntos repartidos regularmente para una paleta muy amplia.",
        pt: "Cinco pontos regularmente distribuidos para uma paleta muito ampla.",
      },
      construction: {
        fr: "Base + quatre points a intervalles de 72 deg.",
        de: "Basis + vier Punkte im Abstand von 72 Grad.",
        en: "Base + four points spaced by 72 degrees.",
        es: "Base + cuatro puntos separados por 72 grados.",
        pt: "Base + quatro pontos separados por 72 graus.",
      },
      usage: {
        fr: "Pratique pour brainstormer une grosse prod avec letters, personnage, fond, effets et details. En vrai mur, reduis ensuite a 2 ou 3 roles dominants et rabats le reste avec Tone pour garder la lecture.",
        de: "Praktisch, um eine grosse Produktion mit Letters, Character, Background, Effekten und Details zu brainstormen. Auf der echten Wand solltest du danach auf 2 oder 3 dominante Rollen reduzieren und den Rest mit Tone beruhigen.",
        en: "Useful for brainstorming a big production with letters, character, background, effects, and details. On the actual wall, reduce it to 2 or 3 dominant roles and mute the rest with Tone so the piece stays readable.",
        es: "Util para pensar una produccion grande con letras, personaje, fondo, efectos y detalles. En el muro real conviene reducirlo a 2 o 3 roles dominantes y bajar el resto con Tone para conservar lectura.",
        pt: "Util para pensar uma producao grande com letters, character, fundo, efeitos e detalhes. Na parede real convem reduzi-lo a 2 ou 3 papeis dominantes e baixar o resto com Tone para manter leitura.",
      },
    },
  },
  "warm-cool": {
    label: { fr: "Chaud / froid", de: "Warm / kalt", en: "Warm / cool", es: "Calido / frio", pt: "Quente / frio" },
    formula: { fr: "-28 / -14 / +14 / +28", de: "-28 / -14 / +14 / +28", en: "-28 / -14 / +14 / +28", es: "-28 / -14 / +14 / +28", pt: "-28 / -14 / +14 / +28" },
    description: {
      fr: "Equivalent pratique du mode warm/cool du Color Guide Adobe, pour pousser la teinte de part et d'autre.",
      de: "Praktische Version des Adobe-Color-Guide-Modus warm/kalt, um den Farbton in beide Richtungen zu schieben.",
      en: "A practical version of Adobe Color Guide's warm/cool mode, pushing hue in both directions.",
      es: "Version practica del modo warm/cool de Adobe para empujar el tono hacia ambos lados.",
      pt: "Versao pratica do modo warm/cool da Adobe para empurrar o matiz para ambos os lados.",
    },
    tooltip: {
      summary: {
        fr: "Un basculement fin de la couleur vers des sensations plus chaudes ou plus froides.",
        de: "Eine feine Verschiebung der Farbe zu waermeren oder kuehleren Empfindungen.",
        en: "A subtle shift of the color toward warmer or cooler sensations.",
        es: "Un desplazamiento fino del color hacia sensaciones mas calidas o frias.",
        pt: "Um deslocamento subtil da cor para sensacoes mais quentes ou frias.",
      },
      construction: {
        fr: "On decale legerement la teinte autour de la base: -28, -14, +14 et +28 deg.",
        de: "Der Farbton wird leicht um die Basis verschoben: -28, -14, +14 und +28 Grad.",
        en: "The hue is shifted slightly around the base: -28, -14, +14, and +28 degrees.",
        es: "Se desplaza ligeramente el tono alrededor de la base: -28, -14, +14 y +28 grados.",
        pt: "Desloca-se ligeiramente o matiz em volta da base: -28, -14, +14 e +28 graus.",
      },
      usage: {
        fr: "Tres fort pour pousser certains plans vers l'avant ou l'arriere, ou pour suggerer une source lumineuse chaude d'un cote et froide de l'autre. Mixe-le avec Shade et Tint pour une 3D plus cinematographique.",
        de: "Sehr stark, um bestimmte Ebenen nach vorn oder hinten zu schieben oder eine warme Lichtquelle auf der einen und eine kalte auf der anderen Seite anzudeuten. Mit Shade und Tint entsteht ein filmischeres 3D.",
        en: "Very strong for pushing some planes forward or back, or suggesting a warm light source on one side and a cool one on the other. Mix it with Shade and Tint for a more cinematic 3D.",
        es: "Muy potente para empujar unos planos hacia delante o hacia atras, o para sugerir una luz calida de un lado y fria del otro. Mezclado con Shade y Tint da un 3D mas cinematografico.",
        pt: "Muito forte para empurrar alguns planos para a frente ou para tras, ou para sugerir uma luz quente de um lado e fria do outro. Misturado com Shade e Tint da um 3D mais cinematografico.",
      },
    },
  },
  "vivid-muted": {
    label: { fr: "Vif / attenue", de: "Kraeftig / gedaempft", en: "Vivid / muted", es: "Vivo / apagado", pt: "Vivo / suave" },
    formula: { fr: "sat -45 / -20 / +20 / +45", de: "sat -45 / -20 / +20 / +45", en: "sat -45 / -20 / +20 / +45", es: "sat -45 / -20 / +20 / +45", pt: "sat -45 / -20 / +20 / +45" },
    description: {
      fr: "Equivalent pratique du mode vivid/muted d'Adobe, en calmant ou en renforcant la saturation.",
      de: "Praktische Version des Adobe-Modus vivid/muted, bei der Saettigung beruhigt oder verstaerkt wird.",
      en: "A practical version of Adobe's vivid/muted mode, reducing or reinforcing saturation.",
      es: "Version practica del modo vivid/muted de Adobe, calmando o reforzando la saturacion.",
      pt: "Versao pratica do modo vivid/muted da Adobe, reduzindo ou reforcando a saturacao.",
    },
    tooltip: {
      summary: {
        fr: "Une variation d'intensite chromatique sans changer radicalement la teinte.",
        de: "Eine Variation der Farbintensitaet, ohne den Farbton radikal zu aendern.",
        en: "A variation in chromatic intensity without radically changing the hue.",
        es: "Una variacion de intensidad cromatica sin cambiar radicalmente el tono.",
        pt: "Uma variacao de intensidade cromatica sem mudar radicalmente o matiz.",
      },
      construction: {
        fr: "On baisse ou on renforce la saturation autour de la base, avec une petite compensation de luminosite.",
        de: "Die Saettigung wird um die Basis herum gesenkt oder erhoeht, mit leichter Helligkeitskompensation.",
        en: "Saturation is reduced or increased around the base, with a slight lightness compensation.",
        es: "Se baja o aumenta la saturacion alrededor de la base con una pequena compensacion de luminosidad.",
        pt: "A saturacao e reduzida ou aumentada em volta da base com uma pequena compensacao de luminosidade.",
      },
      usage: {
        fr: "Ideal pour faire ressortir la piece du fond: garde le fill vif et rabats le decor, ou l'inverse pour un rendu vieilli. Combine-le avec Analogues pour un fade subtil ou avec Complementaire pour un choc mieux controle.",
        de: "Ideal, um das Piece vom Hintergrund zu trennen: Lass den Fill kraeftig und nimm das Umfeld zurueck, oder umgekehrt fuer einen gealterten Look. Mit Analogous fuer subtile Fades oder mit Complementary fuer einen kontrollierteren Schock kombinieren.",
        en: "Ideal for separating the piece from the background: keep the fill vivid and mute the surroundings, or reverse it for an aged look. Combine it with Analogous for subtle fades or with Complementary for a more controlled hit.",
        es: "Ideal para separar la pieza del fondo: deja el fill vivo y baja el entorno, o al reves para un aspecto envejecido. Combinado con Analogous da fades sutiles y con Complementary un golpe mas controlado.",
        pt: "Ideal para separar a piece do fundo: mantem o fill vivo e baixa o resto, ou o contrario para um aspeto envelhecido. Combinado com Analogous da fades subtis e com Complementary um impacto mais controlado.",
      },
    },
  },
  "tints-shades": {
    label: { fr: "Clairs / fonces", de: "Hell / dunkel", en: "Lights / darks", es: "Claros / oscuros", pt: "Claros / escuros" },
    formula: {
      fr: "ombres / clairs combines",
      de: "dunkel / hell kombiniert",
      en: "combined darks / lights",
      es: "oscuros / claros combinados",
      pt: "escuros / claros combinados",
    },
    description: {
      fr: "Variation mixte inspiree du Color Guide Adobe, avec des ouvertures claires et des densifications sombres.",
      de: "Gemischte Variation nach Adobe Color Guide, mit hellen Oeffnungen und dunklen Verdichtungen.",
      en: "A mixed variation inspired by Adobe Color Guide, with lighter openings and darker densifications.",
      es: "Variacion mixta inspirada en Adobe Color Guide, con aperturas claras y densificaciones oscuras.",
      pt: "Variacao mista inspirada no Adobe Color Guide, com aberturas claras e densificacoes escuras.",
    },
    tooltip: {
      summary: {
        fr: "Une rampe mixte qui ouvre et densifie la couleur dans les deux sens.",
        de: "Eine gemischte Rampe, die die Farbe in beide Richtungen oeffnet und verdichtet.",
        en: "A mixed ramp that opens and densifies the color in both directions.",
        es: "Una rampa mixta que abre y densifica el color en ambos sentidos.",
        pt: "Uma rampa mista que abre e densifica a cor nos dois sentidos.",
      },
      construction: {
        fr: "Deux versions plus sombres via noir, puis deux versions plus claires via blanc.",
        de: "Zwei dunklere Versionen ueber Schwarz, dann zwei hellere ueber Weiss.",
        en: "Two darker versions through black, then two lighter versions through white.",
        es: "Dos versiones mas oscuras con negro y luego dos versiones mas claras con blanco.",
        pt: "Duas versoes mais escuras com preto e depois duas versoes mais claras com branco.",
      },
      usage: {
        fr: "C'est le kit rapide pour un bubble, un block letter ou un throw-up propre: ombre, couleur moyenne, lumiere. Ajoute un Hue shift leger si tu veux plus de mouvement sans perdre le controle du set.",
        de: "Das ist das schnelle Kit fuer Bubble, Block Letter oder ein sauberes Throw-up: Schatten, Mittelton, Licht. Fuege einen leichten Hue shift hinzu, wenn du mehr Bewegung willst, ohne die Kontrolle ueber das Set zu verlieren.",
        en: "This is the fast kit for a bubble, block letter, or clean throw-up: shadow, middle color, and light. Add a light Hue shift if you want more movement without losing control of the set.",
        es: "Es el kit rapido para un bubble, block letter o throw-up limpio: sombra, color medio y luz. Anade un Hue shift suave si quieres mas movimiento sin perder control del set.",
        pt: "Este e o kit rapido para um bubble, block letter ou throw-up limpo: sombra, cor media e luz. Junta um Hue shift leve se quiseres mais movimento sem perder o controlo do set.",
      },
    },
  },
  custom: {
    label: { fr: "Libre", de: "Frei", en: "Custom", es: "Libre", pt: "Livre" },
    formula: { fr: "libre", de: "frei", en: "free", es: "libre", pt: "livre" },
    description: {
      fr: "Mode libre inspire de Photoshop. Aucune geometrie n'est imposee : tu pilotes uniquement la couleur de base.",
      de: "Freier Modus nach Photoshop. Keine Geometrie ist vorgegeben: du steuerst nur die Basisfarbe.",
      en: "A Photoshop-inspired free mode. No geometry is imposed: you only control the base color.",
      es: "Modo libre inspirado en Photoshop. No se impone ninguna geometria: solo controlas el color base.",
      pt: "Modo livre inspirado no Photoshop. Nenhuma geometria e imposta: controlas apenas a cor base.",
    },
    tooltip: {
      summary: {
        fr: "Aucune geometrie imposee: tu restes sur la couleur de base et tu ajustes librement.",
        de: "Keine vorgegebene Geometrie: du bleibst auf der Basisfarbe und justierst frei.",
        en: "No fixed geometry: you stay on the base color and adjust freely.",
        es: "Sin geometria impuesta: te quedas con el color base y ajustas libremente.",
        pt: "Sem geometria imposta: ficas na cor base e ajustas livremente.",
      },
      construction: {
        fr: "L'algorithme ne genere pas de points derives; seule la base est active.",
        de: "Der Algorithmus erzeugt keine abgeleiteten Punkte; nur die Basis ist aktiv.",
        en: "The algorithm generates no derived points; only the base remains active.",
        es: "El algoritmo no genera puntos derivados; solo la base permanece activa.",
        pt: "O algoritmo nao gera pontos derivados; apenas a base fica ativa.",
      },
      usage: {
        fr: "Sers-t'en pour verrouiller une vraie ref de bombe, remplir ton panier et tester ensuite les variantes une par une. C'est le meilleur point de depart pour mixer a la main Complementaire, Tint, Shade ou Tone selon le mur.",
        de: "Nutze es, um eine echte Dosen-Referenz zu fixieren, den Warenkorb zu fuellen und dann Varianten eine nach der anderen zu testen. Das ist der beste Startpunkt, um Complementary, Tint, Shade oder Tone je nach Wand manuell zu mischen.",
        en: "Use it to lock a real can reference, build your cart, and test variations one by one. It is the best starting point when you want to mix Complementary, Tint, Shade, or Tone by hand for a specific wall.",
        es: "Usalo para fijar una referencia real de spray, llenar el carrito y probar variaciones una por una. Es el mejor punto de partida para mezclar a mano Complementary, Tint, Shade o Tone segun el muro.",
        pt: "Usa-o para fixar uma referencia real de spray, encher o carrinho e testar variacoes uma a uma. E o melhor ponto de partida para misturar manualmente Complementary, Tint, Shade ou Tone conforme a parede.",
      },
    },
  },
};

const GENERATED_LABELS = {
  Complementaire: { fr: "Complementaire", de: "Komplementaer", en: "Complementary", es: "Complementario", pt: "Complementar" },
  "Split gauche": { fr: "Split gauche", de: "Split links", en: "Left split", es: "Split izquierdo", pt: "Split esquerdo" },
  "Split droite": { fr: "Split droite", de: "Split rechts", en: "Right split", es: "Split derecho", pt: "Split direito" },
  "Voisine froide": { fr: "Voisine froide", de: "Kuehler Nachbar", en: "Cool neighbor", es: "Vecino frio", pt: "Vizinho frio" },
  "Voisine chaude": { fr: "Voisine chaude", de: "Warmer Nachbar", en: "Warm neighbor", es: "Vecino calido", pt: "Vizinho quente" },
  "Accent oppose": { fr: "Accent oppose", de: "Gegenakzent", en: "Opposite accent", es: "Acento opuesto", pt: "Acento oposto" },
  "Triade A": { fr: "Triade A", de: "Triade A", en: "Triad A", es: "Triada A", pt: "Triade A" },
  "Triade B": { fr: "Triade B", de: "Triade B", en: "Triad B", es: "Triada B", pt: "Triade B" },
  "Rectangle A": { fr: "Rectangle A", de: "Rechteck A", en: "Rectangle A", es: "Rectangulo A", pt: "Retangulo A" },
  "Rectangle B": { fr: "Rectangle B", de: "Rechteck B", en: "Rectangle B", es: "Rectangulo B", pt: "Retangulo B" },
  "Rectangle C": { fr: "Rectangle C", de: "Rechteck C", en: "Rectangle C", es: "Rectangulo C", pt: "Retangulo C" },
  "Carre A": { fr: "Carre A", de: "Quadrat A", en: "Square A", es: "Cuadrado A", pt: "Quadrado A" },
  "Carre B": { fr: "Carre B", de: "Quadrat B", en: "Square B", es: "Cuadrado B", pt: "Quadrado B" },
  "Carre C": { fr: "Carre C", de: "Quadrat C", en: "Square C", es: "Cuadrado C", pt: "Quadrado C" },
  "Voisin A": { fr: "Voisin A", de: "Nachbar A", en: "Neighbor A", es: "Vecino A", pt: "Vizinho A" },
  "Voisin B": { fr: "Voisin B", de: "Nachbar B", en: "Neighbor B", es: "Vecino B", pt: "Vizinho B" },
  "Oppose voisin A": { fr: "Oppose voisin A", de: "Gegen-Nachbar A", en: "Opposite neighbor A", es: "Vecino opuesto A", pt: "Vizinho oposto A" },
  "Oppose voisin B": { fr: "Oppose voisin B", de: "Gegen-Nachbar B", en: "Opposite neighbor B", es: "Vecino opuesto B", pt: "Vizinho oposto B" },
  Dense: { fr: "Dense", de: "Dicht", en: "Dense", es: "Denso", pt: "Denso" },
  Moyen: { fr: "Moyen", de: "Mittel", en: "Medium", es: "Medio", pt: "Medio" },
  Aerien: { fr: "Aerien", de: "Luftig", en: "Airy", es: "Aereo", pt: "Aereo" },
  Lumineux: { fr: "Lumineux", de: "Hell", en: "Luminous", es: "Luminoso", pt: "Luminoso" },
  "Accent analogue": { fr: "Accent analogue", de: "Analoger Akzent", en: "Analog accent", es: "Acento analogo", pt: "Acento analogo" },
  Complement: { fr: "Complement", de: "Komplement", en: "Complement", es: "Complementario", pt: "Complementar" },
  "Accent compose": { fr: "Accent compose", de: "Komposit-Akzent", en: "Compound accent", es: "Acento compuesto", pt: "Acento composto" },
  "Nuance sombre": { fr: "Nuance sombre", de: "Dunkle Stufe", en: "Dark shade", es: "Matiz oscuro", pt: "Matiz escuro" },
  "Nuance dense": { fr: "Nuance dense", de: "Dichte Stufe", en: "Dense shade", es: "Matiz denso", pt: "Matiz denso" },
  "Nuance claire": { fr: "Nuance claire", de: "Helle Stufe", en: "Light shade", es: "Matiz claro", pt: "Matiz claro" },
  "Nuance pale": { fr: "Nuance pale", de: "Blasse Stufe", en: "Pale shade", es: "Matiz palido", pt: "Matiz palido" },
  "Pentagram B": { fr: "Pentagramme B", de: "Pentagramm B", en: "Pentagram B", es: "Pentagrama B", pt: "Pentagrama B" },
  "Pentagram C": { fr: "Pentagramme C", de: "Pentagramm C", en: "Pentagram C", es: "Pentagrama C", pt: "Pentagrama C" },
  "Pentagram D": { fr: "Pentagramme D", de: "Pentagramm D", en: "Pentagram D", es: "Pentagrama D", pt: "Pentagrama D" },
  "Pentagram E": { fr: "Pentagramme E", de: "Pentagramm E", en: "Pentagram E", es: "Pentagrama E", pt: "Pentagrama E" },
};

function resolvePath(source, path) {
  return path.split(".").reduce((result, part) => result?.[part], source);
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

function pickLocalizedMap(value, language) {
  if (!value || typeof value !== "object") {
    return value;
  }

  return value[language] ?? value[DEFAULT_LANGUAGE] ?? Object.values(value)[0];
}

function pickLanguage(language) {
  return UI_STRINGS[language] ? language : DEFAULT_LANGUAGE;
}

export function getLocaleTag(language) {
  return LOCALE_TAGS[pickLanguage(language)] || LOCALE_TAGS[DEFAULT_LANGUAGE];
}

export function t(language, key, params = {}) {
  const normalized = pickLanguage(language);
  let value = resolvePath(UI_STRINGS[normalized], key);

  if (value == null) {
    value = resolvePath(UI_STRINGS[DEFAULT_LANGUAGE], key);
  }

  if (value == null) {
    return key;
  }

  if (typeof value === "object" && value.one && value.other) {
    value = params.count === 1 ? value.one : value.other;
  }

  return interpolate(value, params);
}

export function getLocalizedTheorySection(section, language) {
  const labelMap = THEORY_SECTION_LABELS[section.id];
  return {
    ...section,
    label: labelMap ? pickLocalizedMap(labelMap, language) : section.label,
  };
}

export function getLocalizedTheory(theory, language) {
  const localization = THEORY_LOCALIZATIONS[theory.id];

  if (!localization) {
    return theory;
  }

  return {
    ...theory,
    label: pickLocalizedMap(localization.label, language),
    formula: pickLocalizedMap(localization.formula, language),
    description: pickLocalizedMap(localization.description, language),
    tooltip: localization.tooltip
      ? {
          summary: pickLocalizedMap(localization.tooltip.summary, language),
          construction: pickLocalizedMap(localization.tooltip.construction, language),
          usage: pickLocalizedMap(localization.tooltip.usage, language),
        }
      : null,
  };
}

export function getTheoryAliasEntries() {
  return Object.entries(THEORY_LOCALIZATIONS).map(([id, localization]) => {
    const aliases = new Set([
      ...Object.values(localization.label || {}),
      ...(THEORY_REFERENCE_ALIASES[id] || []),
    ]);

    return {
      id,
      aliases: [...aliases].filter(Boolean),
    };
  });
}

function localizeColorMix(match, language) {
  const [, amount, colorWord] = match;
  const colorKey = {
    blanc: "white",
    noir: "black",
    gris: "gray",
  }[colorWord.toLowerCase()];

  if (!colorKey) {
    return `${amount} ${colorWord}`;
  }

  return `${amount} ${t(language, `units.${colorKey}`)}`;
}

export function localizeGeneratedText(value, language) {
  if (!value) {
    return value;
  }

  if (GENERATED_LABELS[value]) {
    return pickLocalizedMap(GENERATED_LABELS[value], language);
  }

  const degreeMatch = value.match(/^([+-]?\d+)\sdeg$/i);
  if (degreeMatch) {
    return `${degreeMatch[1]} ${t(language, "units.degree")}`;
  }

  const mixMatch = value.match(/^([+-]?\d+%)\s(blanc|noir|gris)$/i);
  if (mixMatch) {
    return localizeColorMix(mixMatch, language);
  }

  const hueMatch = value.match(/^Teinte\s([+-]?\d+)$/i);
  if (hueMatch) {
    const labels = {
      fr: "Teinte",
      de: "Farbton",
      en: "Hue",
      es: "Tono",
      pt: "Matiz",
    };
    return `${labels[pickLanguage(language)]} ${hueMatch[1]}`;
  }

  const coolMatch = value.match(/^Froid\s([+-]?\d+)$/i);
  if (coolMatch) {
    const labels = {
      fr: "Froid",
      de: "Kalt",
      en: "Cool",
      es: "Frio",
      pt: "Frio",
    };
    return `${labels[pickLanguage(language)]} ${coolMatch[1]}`;
  }

  const warmMatch = value.match(/^Chaud\s([+-]?\d+)$/i);
  if (warmMatch) {
    const labels = {
      fr: "Chaud",
      de: "Warm",
      en: "Warm",
      es: "Calido",
      pt: "Quente",
    };
    return `${labels[pickLanguage(language)]} ${warmMatch[1]}`;
  }

  const lightMatch = value.match(/^Clair\s(\d+%)$/i);
  if (lightMatch) {
    const labels = {
      fr: "Clair",
      de: "Hell",
      en: "Light",
      es: "Claro",
      pt: "Claro",
    };
    return `${labels[pickLanguage(language)]} ${lightMatch[1]}`;
  }

  const darkMatch = value.match(/^Fonce\s(\d+%)$/i);
  if (darkMatch) {
    const labels = {
      fr: "Fonce",
      de: "Dunkel",
      en: "Dark",
      es: "Oscuro",
      pt: "Escuro",
    };
    return `${labels[pickLanguage(language)]} ${darkMatch[1]}`;
  }

  const shadeMatch = value.match(/^Ombre\s(\d+%)$/i);
  if (shadeMatch) {
    const labels = {
      fr: "Ombre",
      de: "Schatten",
      en: "Shade",
      es: "Sombra",
      pt: "Sombra",
    };
    return `${labels[pickLanguage(language)]} ${shadeMatch[1]}`;
  }

  const toneMatch = value.match(/^Ton\s(\d+%)$/i);
  if (toneMatch) {
    const labels = {
      fr: "Ton",
      de: "Ton",
      en: "Tone",
      es: "Tono",
      pt: "Tom",
    };
    return `${labels[pickLanguage(language)]} ${toneMatch[1]}`;
  }

  const mutedMatch = value.match(/^Attenue\s(\d+)$/i);
  if (mutedMatch) {
    const labels = {
      fr: "Attenue",
      de: "Gedaempft",
      en: "Muted",
      es: "Apagado",
      pt: "Suave",
    };
    return `${labels[pickLanguage(language)]} ${mutedMatch[1]}`;
  }

  const vividMatch = value.match(/^Vif\s(\d+)$/i);
  if (vividMatch) {
    const labels = {
      fr: "Vif",
      de: "Kraeftig",
      en: "Vivid",
      es: "Vivo",
      pt: "Vivo",
    };
    return `${labels[pickLanguage(language)]} ${vividMatch[1]}`;
  }

  const generatedKey = {
    "ombre forte": "strongShadow",
    appui: "support",
    ouverture: "opening",
    lumiere: "light",
  }[value.toLowerCase()];

  if (generatedKey) {
    return t(language, `generated.${generatedKey}`);
  }

  return value;
}
