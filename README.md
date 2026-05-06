# 🔥 Ignite

> **La seule app anti-procrastination que tu ne procrastineras pas à utiliser.**

La plupart des outils de productivité souffrent d'un paradoxe cruel : leurs utilisateurs procrastinent déjà à les configurer, les apprendre, et s'y tenir. Ignite est conçu à l'opposé de cette logique.

L'idée est simple : **s'inscrire dans le quotidien de l'utilisateur de façon si fluide qu'elle devient un automatisme**. Pas de configuration complexe, pas de méthode à apprendre. Juste ouvrir l'app le matin, noter ses tâches, les cocher au fil de la journée, et clôturer le soir. En quelques semaines, ce réflexe devient naturel — et c'est précisément l'un des mécanismes les plus efficaces contre la procrastination.

Le système de flamme 🔥 fait le reste : perdre une série devient plus douloureux que de ne pas faire sa tâche.

Ignite représente la flamme de la volonté !

---

## Ce que l'app permet de faire

### Aujourd'hui — Gérer sa journée

L'écran principal est le cœur de l'app. Chaque matin, l'utilisateur est accueilli par son prénom et invité à planifier sa journée.

- **Ajouter des tâches** en texte libre, sans catégorie ni priorité forcée
- **Cocher les tâches** au fur et à mesure qu'elles sont accomplies
- **Supprimer une tâche** avec confirmation pour éviter les suppressions accidentelles
- **Suivre sa progression en temps réel** grâce à une barre de progression qui indique le pourcentage accompli et le nombre de tâches restantes pour valider la flamme du jour
- **Clôturer sa journée** à partir d'une heure définie dans les paramètres — la clôture enregistre le résultat dans l'historique et valide ou non la flamme du jour selon la règle des ⅔ (au moins 67 % des tâches accomplies)

### Flamme & Séries — Suivre sa régularité

L'écran Streak est le moteur de motivation de l'app.

- **Série actuelle** : nombre de jours consécutifs où la flamme a été validée
- **Meilleure série** : record personnel de l'utilisateur
- **Jours complétés** : total historique de journées réussies
- **Calendrier mensuel** : visualisation du mois en cours, avec un 🔥 sur chaque jour validé et le jour actuel mis en évidence
- **Système de rangs** progressifs basés sur la durée de la série :
    - 🕯️ **Étincelle** — 7 jours
    - 🔥 **Flamme Ardente** — 30 jours
    - 🌋 **Inferno** — 90 jours
    - ⚡ **Légende** — 365 jours
- **Barre de progression** vers le rang suivant, avec le nombre de jours restants

### Focus — Timer Pomodoro

Un minuteur Pomodoro intégré, conçu pour survivre au verrouillage de l'écran et à la mise en arrière-plan de l'app.

- **Sessions de 25 minutes** de travail entrecoupées de **pauses courtes (5 min)** et d'une **pause longue (15 min)** après 4 sessions
- **Anneau de progression** SVG animé qui affiche visuellement le temps restant
- **Persistance en arrière-plan** : le timer est basé sur une heure de fin stockée localement, pas sur un intervalle — le temps restant est toujours correct même si l'app a été fermée ou mise en veille
- **Notification locale** programmée à la fin de chaque session, reçue même si le téléphone est verrouillé
- **Actions depuis la notification** (iOS 16+) : passer la pause ou arrêter le timer sans rouvrir l'app
- **Vibration de fin de session** (activable/désactivable dans les paramètres)
- **Sélection des tâches à traiter** pendant la session Pomodoro, directement depuis la liste du jour
- **Compteur de Pomodoros** complétés, visible dans l'interface

### Amis — Comparaison sociale

Un espace pour suivre les séries de ses proches et rester motivé par l'émulation.

- **Ajouter des amis** avec leur nom et un lien optionnel (profil, contact)
- **Renseigner leur série actuelle et leur meilleure série** manuellement
- **Classement automatique** des amis par série décroissante
- **Modifier les informations** d'un ami (nom, lien, séries) via une fiche d'édition
- **Supprimer un ami** avec confirmation

### Paramètres — Personnaliser l'expérience

- **Prénom** : l'app s'adresse à l'utilisateur par son nom sur l'écran principal
- **Heure de clôture** : sélectionner l'heure à partir de laquelle la journée peut être clôturée (entre 15h et 23h)
- **Notifications push** : activer ou désactiver les rappels de motivation envoyés tout au long de la journée (9h, 11h, 13h, 15h, 17h, 19h)
- **Son Pomodoro** : activer ou désactiver la vibration à la fin d'une session Focus
- **Statistiques** : récapitulatif de la série actuelle, de la meilleure série et du nombre de jours complétés

---

## Règle de validation de la flamme

Une journée est **validée** (la flamme 🔥 est comptée) si l'utilisateur a accompli **au moins ⅔ de ses tâches du jour** avant de clôturer. L'app affiche en temps réel combien de tâches il reste à cocher pour atteindre ce seuil. Une journée sans tâche peut être clôturée, mais ne valide pas de flamme.

---

## Données & confidentialité

Toutes les données — tâches, historique, séries, amis, préférences — sont **stockées localement sur l'appareil** via AsyncStorage. Aucune donnée n'est envoyée à un serveur. Aucun compte n'est nécessaire.

---

## Stack technique

- **React Native** avec Expo (SDK 54)
- **TypeScript**
- **Zustand** pour la gestion d'état globale avec persistance AsyncStorage
- **expo-notifications** pour les notifications locales et le timer Pomodoro en arrière-plan
- **react-native-svg** pour l'anneau de progression du timer
- **react-navigation** (bottom tabs) pour la navigation entre les écrans

---

## Lancer le projet

**Prérequis**
- Node.js 18 ou supérieur
- npm
- Expo Go sur votre téléphone (ou un simulateur iOS/Android)

**Installation**

```bash
git clone git@github.com:maxime-knv/Ignite.git
cd Ignite
npm install
npx expo start
```

Scannez le QR code avec Expo Go (Android) ou l'app Appareil photo (iOS).

---

## Contributors
- maxime.kournikov@epitech.eu
- orion.prieto@epitech.eu
