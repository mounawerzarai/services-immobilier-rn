# Services Immobilier — version React Native

Application mobile de petites annonces immobilières en Tunisie : on y publie un bien à vendre ou à louer, on recherche et on filtre les annonces, on les voit sur une carte, on les met en favoris et on écrit au vendeur en temps réel.

Cette version est écrite en **React Native (TypeScript) avec Expo**. Une version jumelle en **Flutter** a les mêmes fonctionnalités et utilise la même base Firebase : [services-immobilier-flutter](https://github.com/mounawerzarai/services-immobilier-flutter).

Projet de 3e année DSI, ISET Tozeur.

## Équipe

| Nom |
|---|
| Mounawer Zarai |
| Yassine Fekih |
| Yassmine Gaabel |
| Tayssier |

## Fonctionnalités

- Inscription, connexion, mot de passe oublié, profil modifiable
- Publier une annonce avec 1 à 8 photos et sa position, la modifier, la supprimer, la marquer vendue ou louée
- Liste paginée et fiche détaillée avec carrousel de photos
- Recherche texte (sans accents), filtres (vente ou location, type, ville, prix, pièces) et tri par date ou prix
- Carte avec un marqueur par annonce, et recherche « autour de moi » avec un rayon en km
- Favoris
- Messagerie en temps réel, badge de messages non lus, alerte dans l'appli à l'arrivée d'un message
- Bandeau « hors ligne » et compteur de caractères dans le chat

## Technologies

| Brique | Choix |
|---|---|
| Interface | React Native 0.88, Expo SDK 58, TypeScript |
| Navigation | React Navigation |
| Authentification et base de données | Firebase (Authentication et Cloud Firestore), SDK JavaScript |
| Photos | Cloudinary (envoi non signé) ; seule l'adresse de l'image est stockée dans Firestore |
| Carte | MapLibre sur mobile, Leaflet sur le web, fond OpenStreetMap (aucune clé payante) |
| Position | `react-native-geolocation-service` (mobile), géolocalisation du navigateur (web) |

Le projet utilise le plan gratuit **Firebase Spark** : pas de Firebase Storage, pas de Cloud Functions. Il n'y a donc pas de notification push vers une appli fermée ; une alerte s'affiche dans l'appli ouverte.

## Prérequis

- Node.js (version LTS) et npm
- Git
- Le fichier `.env` avec la configuration Firebase (voir plus bas)
- Pour un lancement sur Android : Android Studio avec un émulateur, un JDK (celui d'Android Studio convient), la variable `ANDROID_HOME` qui pointe vers le SDK, et le NDK installé par le SDK Manager

## Installation

```bash
git clone https://github.com/mounawerzarai/services-immobilier-rn.git
cd services-immobilier-rn
git checkout develop
npm install
```

### Configuration Firebase

1. Copier `.env.example` en `.env`.
2. Remplir les valeurs de l'application web du projet Firebase `services-immobilier-61aaf` (console Firebase, Paramètres du projet, Vos applications).

Le fichier `.env` n'est jamais versionné. Les photos partent vers le compte Cloudinary de l'équipe (`src/services/imageUploader.ts`, préréglage non signé `immobilier_unsigned`).

## Lancer l'application

### Dans le navigateur (le plus simple pour tester)

```bash
npx expo start --web
```

### Sur Android

Les bibliothèques de carte sont du code natif : **Expo Go ne convient pas**, il faut compiler l'application.

```bash
npx expo run:android
```

Cette commande génère le dossier `android/` (ignoré par Git), compile et lance l'appli sur l'émulateur ou le téléphone branché. Le premier build est long. Ensuite, `npm start` relance le serveur Metro.

### Problèmes connus

- **`JAVA_HOME` introuvable** : pointer vers le JDK d'Android Studio (dossier `jbr`).
- **`SDK location not found`** : définir `ANDROID_HOME`, puis ouvrir un nouveau terminal.
- **Téléchargement de Gradle qui expire** : dans `android/gradle/wrapper/gradle-wrapper.properties`, mettre `networkTimeout=300000`.
- **NDK incomplet** (`source.properties` manquant) : supprimer le dossier `ndk/<version>` du SDK Android, puis le réinstaller depuis le SDK Manager.
- **`INSTALL_FAILED_UPDATE_INCOMPATIBLE`** : la version Flutter a le même identifiant de paquet. Désinstaller l'autre appli : `adb uninstall com.servicesimmobilier.services_immobilier`.

## Vérifier le code

```bash
npm run lint
npx tsc --noEmit
```

## Base de données Firestore

Les règles de sécurité et les index sont dans `firebase/` (`firestore.rules`, `firestore.indexes.json`). Pour les déployer :

```bash
cd firebase
firebase deploy --only firestore
```

| Collection | Contenu | Qui peut écrire |
|---|---|---|
| `users/{uid}` | profil | le propriétaire |
| `users/{uid}/favorites/{listingId}` | favoris | le propriétaire |
| `listings/{id}` | annonces | le vendeur |
| `conversations/{id}` | conversation entre deux personnes pour une annonce | les deux participants |
| `conversations/{id}/messages/{id}` | messages | les deux participants |

Les annonces se lisent sans compte. Firestore n'a pas de recherche plein texte : l'appli charge les 200 annonces disponibles les plus récentes et filtre côté appareil.

## Structure du projet

```
src/
├── components/        éléments d'interface réutilisables
├── core/              Firebase, boîtes de dialogue, événements
├── data/
│   ├── models/        User, Listing, Conversation
│   └── services/      accès à Firestore (annonces, favoris, messages, utilisateurs)
├── features/
│   ├── auth/          validation des formulaires
│   ├── listings/      carte d'annonce, carrousel, formats
│   ├── search/        recherche, filtres, tri
│   ├── map/           position, distance, « autour de moi »
│   ├── messaging/     formats et noms des interlocuteurs
│   ├── notifications/ alertes de nouveaux messages
│   └── offline/       bandeau hors ligne
├── navigation/        onglets et écrans
├── screens/           un fichier par écran
└── services/          envoi des photos (Cloudinary), publication d'annonce
```

Les noms des modules et des écrans sont les mêmes que dans la version Flutter, pour comparer les deux applications écran par écran.

## Règles Git

- `main` : versions stables.
- `develop` : intégration du travail en cours.
- `feature/AIFRN-<n°>-<description>` : une branche par ticket, créée depuis `develop`.
- Chaque modification passe par une pull request vers **`develop`** (vérifier la branche de base, GitHub propose `main` par défaut).
- Les messages de commit commencent par la clé Jira, par exemple `AIFRN-41: écran Mes favoris`.

## Suivi du projet

Jira, projet « Application Immobilier (Flutter + React Native) », clé `AIFRN`. Les tests manuels (77 cas par application) sont décrits dans le fichier `plan-de-tests.xlsx` du rapport.
