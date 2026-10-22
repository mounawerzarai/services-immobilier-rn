# Services Immobilier – version React Native

Application mobile de recherche, consultation et publication d’annonces immobilières (vente et location), avec carte, messagerie et notifications. Cette version est écrite en **React Native (TypeScript) avec Expo**. Une version jumelle en Flutter partage le même backend Firebase : [services-immobilier-flutter](https://github.com/mounawerzarai/services-immobilier-flutter).

## Équipe

| Nom | 
|---|---|
| [Mounawer] | 
| [Yassine] | 
| [Yassmine] | 
| [Tayssier] | 

## Prérequis

- Node.js (LTS) et npm
- Android Studio avec un émulateur Android (ou un téléphone en mode développeur)
- Variable d’environnement `ANDROID_HOME` qui pointe vers le SDK Android (par exemple `C:\Users\<nom>\AppData\Local\Android\sdk`). Ouvrir un nouveau terminal après l’avoir définie.
- NDK **27.1.12297006** installé via Android Studio (Settings, Languages & Frameworks, Android SDK, SDK Tools, *Show Package Details*, *NDK (Side by side)*)
- Git

> Plateforme ciblée : **Android**. iOS seulement si un Mac est disponible dans l’équipe.

## Installation

```bash
git clone https://github.com/mounawerzarai/services-immobilier-rn.git
cd services-immobilier-rn
git checkout develop
npm install
```

## Lancer l’application

Démarrer l’émulateur, puis :

```bash
npx expo run:android
```

Cette commande génère le dossier `android/` (ignoré par Git), compile l’application et la lance. Le premier build est long (10 minutes ou plus). Ensuite, `npm start` suffit pour relancer le serveur Metro.

> L’application est un *development build*, pas Expo Go : les bibliothèques Firebase natives (T2.2) ne fonctionnent pas dans Expo Go.

### Problèmes connus

- **SDK location not found** : définir `ANDROID_HOME` (voir Prérequis) et ouvrir un nouveau terminal. Si le terminal est celui d’Android Studio, redémarrer Android Studio.
- **Installation refusée sur l’émulateur** (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`) : la version Flutter utilise le même identifiant de paquet. Désinstaller l’autre application de l’émulateur :
  `adb uninstall com.servicesimmobilier.services_immobilier`
- **NDK introuvable** : installer la version indiquée dans les prérequis.

## Vérifier le code

```bash
npm run lint
```

## Structure du projet

La structure suit le modèle C4 (niveau 3) : sept modules fonctionnels et une couche d’accès aux données. Les écrans n’appellent jamais Firebase directement : seule la couche `data/services` le fait.

```
src/
├── core/                    thème, navigation, constantes
├── data/
│   ├── models/              User, Listing, Conversation, Message
│   └── services/            auth, listings, storage, messages, location
└── features/
    ├── auth/                inscription, connexion, mot de passe oublié
    ├── listings/            publier, modifier, liste, détail
    ├── search/              filtres, recherche texte, tri
    ├── favorites_profile/   favoris, profil, mes annonces
    ├── map/                 marqueurs, position, autour de moi
    ├── messaging/           conversations, chat en temps réel
    └── notifications/       notifications push
```

Les noms des modules, services et entités sont **identiques** dans la version Flutter, pour comparer les deux applications écran par écran.

## Technologies

| Brique | Bibliothèque |
|---|---|
| Authentification | `@react-native-firebase/auth` |
| Base de données | `@react-native-firebase/firestore` |
| Photos | `@react-native-firebase/storage`, `react-native-image-picker` |
| Notifications | `@react-native-firebase/messaging` |
| Carte | `react-native-maps` (choix du service en Sprint 1) |
| Position | `expo-location` ou `react-native-geolocation-service` |
| Navigation | React Navigation |

Ces bibliothèques sont des propositions à confirmer. Le backend Firebase (Auth, Firestore, Storage, Cloud Messaging) est configuré en tâche **T2.2**.

## Règles Git

- `main` : version stable, livrée.
- `develop` : intégration du travail en cours.
- `feature/AIFRN-<n°>-<description>` : une branche par ticket, créée depuis `develop`. Exemple : `feature/AIFRN-28-publier-annonce`.
- Les modifications passent par une *pull request* vers `develop`, relue par un autre membre.
- Chaque message de commit commence par la clé Jira : `AIFRN-28: formulaire de publication`.

## Suivi du projet

Le suivi se fait dans Jira, projet **Application Immobilier (Flutter + React Native)**, clé `AIFRN`, en 4 sprints (21 octobre au 19 novembre 2026).

## Documentation

- Cahier des charges, modèle C4 et modèle de données Firestore : dossier `docs/` (à ajouter).
- Maquettes : Figma (lien à ajouter).