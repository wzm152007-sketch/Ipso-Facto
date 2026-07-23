# Ipso Facto — site vitrine

Site vitrine **one-page** pour le restaurant français traditionnel **Ipso Facto**
(17 rue de la Maix, 88000 Épinal). HTML / CSS / JavaScript autonomes, responsive et
pensés mobile-first.

## Aperçu

Ouvrez simplement `index.html` dans un navigateur — aucune étape de build n'est requise.

## Structure

```
index.html            Page unique avec ancres de navigation
styles.css            Direction artistique (bistrot contemporain, bordeaux & or)
script.js             Menu mobile, révélations au scroll, lightbox, formulaire de devis
carte-ipso-facto.pdf  La carte complète, téléchargeable depuis la section « La carte »
images/               Photos optimisées utilisées par le site (webp)
source-photos/        Photos et scans de cartes d'origine (matière première)
```

## Sections

1. Header fixe avec bouton **Réserver** (lien `tel:`)
2. Hero plein écran + rappel du **4,9★ Google**
3. L'esprit de la maison — le chef Mathias, cuisson basse température, produits de saison
4. La carte — plats signature, menus et **téléchargement PDF**
5. Les vins — sélection directe producteurs, bio, grands crus au verre
6. Nos producteurs locaux
7. Privatisation / private room + **formulaire de demande de devis**
8. Galerie photos (avec lightbox)
9. Infos pratiques — horaires, adresse, carte Google Maps, contact
10. Footer — coordonnées, réseaux, mentions légales

## Notes techniques

- **Polices** : Cormorant Garamond, Great Vibes et Jost (Google Fonts), avec repli système.
- **Formulaire de devis** : génère un e-mail pré-rempli vers `ipsofacto.resto@gmail.com`
  (aucun backend requis).
- **Accessibilité** : navigation clavier, `aria-*`, focus visibles, respect de
  `prefers-reduced-motion`.
