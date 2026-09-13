# Refonte UX — 13 septembre 2026

## Organisation réalisée

- **Créer** : couleur libre ou bombe, harmonie principale, combinaisons avancées, aperçu de palette, roue et correspondances. Meilleure référence visible, autres marques à déplier.
- **Tonalités** : mode de création accessible depuis Harmonies, trois ou quatre valeurs, continuité de la couleur de base entre les deux modes.
- **Image** : import et prélèvement directement dans l’image, zoom facultatif, couleurs conservées et sprays correspondants.
- **Nuanciers** : une grille par défaut, recherche immédiate, filtres par famille et recherche de références en lot sous un volet dédié. Ajout explicite des lignes sélectionnées.
- **Ma liste** : page dédiée aux quantités, prix unitaire, estimation et fiche imprimable. Annulation disponible après vidage.

## Direction visuelle

Fond neutre, panneaux blancs, typographie sombre, espacement régulier, accent vert réservé aux actions. Les couleurs des palettes occupent les grandes surfaces. Navigation commune ; barre basse sur mobile, réglages dans un panneau avec gestion du focus.

## Vérifications effectuées

- Syntaxe des cinq modules JavaScript modifiés, compilation CSS, unicité des IDs et présence des ressources locales.
- Saisie HEX et changement d’harmonie ; transmission d’une référence depuis le catalogue vers la création et depuis les tonalités vers les harmonies.
- Image de test bicolore : prélèvement exact de #336699, conservation, ouverture du zoom, fermeture avec Échap.
- Recherche de LP-129 : filtrage à une référence. Recherche groupée LP-129 / LP-100 : sélection de LP-129 uniquement et ajout de cette seule ligne.
- Quantités et prix conservés entre pages : 3 sprays à 6,50 donnent 19,50. Vidage et restauration de la liste testés.
- Inspection visuelle à 320, 390, 820 et 1265 pixels de largeur. Correction du masquage hérité des réglages sur tablette. Aucun débordement horizontal constaté dans les vues de création contrôlées.
- Aucune erreur JavaScript remontée dans les parcours contrôlés.

## Limites de vérification

Le clic sur la fiche imprimable ne produit pas d’événement de téléchargement observable dans le navigateur intégré de test. Le mécanisme HTML / Blob existant est conservé ; la récupération du fichier reste à vérifier dans un navigateur utilisateur. Il ne s’agit pas d’un audit exhaustif d’accessibilité ni d’un test utilisateur formel. Les pages secondaires conservent des textes historiques en français ; les textes historiques des pages secondaires ne sont pas tous internationalisés.

## Correction du sélecteur de langue

Accès « Langue » visible dans l’en-tête sur les trois pages, avec cinq boutons directs et indication du choix actif. Les sélecteurs historiques restent masqués pour conserver leurs gestionnaires et la persistance. Traductions complétées pour les nouveaux textes de création, image et liste, ainsi que les titres et principaux contrôles des pages secondaires. Choix des cinq langues vérifié via les boutons, français restauré après rechargement, choix anglais conservé en passant aux nuanciers, contrôle visuel sur mobile 390 px.

## Identité visuelle moderne

Habillage partagé des trois pages : fond ivoire, encre sombre, accent citron, navigation segmentée, typographie Manrope plus affirmée, panneaux aux ombres discrètes et aperçu de palette sur fond sombre. Les valeurs des couleurs produits sont inchangées. Les interactions au survol respectent la préférence de réduction des animations ; le focus clavier reste visible.

Le choix du texte sur les couleurs compare désormais les contrastes du noir et du blanc selon la luminance relative. Vérification sur les 1 650 références et une grille RGB de 4 096 couleurs : contraste minimal 4,58:1. Cette mesure concerne le texte sur les aplats, pas une certification globale d’accessibilité.

Contrôles visuels : création à 1440 px et 390 px, menu des cinq langues à 320 px sans débordement, nuanciers, tonalités et image à la largeur normale du navigateur. Panneau mobile de réglages ouvert et refermé. Compilation CSS et contrôle du diff sans erreur.
