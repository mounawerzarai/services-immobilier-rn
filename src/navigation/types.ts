
export type RootStackParamList = {
  Tabs: undefined;
  Login: undefined;
  Publish: { id?: string } | undefined;
  MyListings: undefined;
  ListingDetail: { id: string };
  Chat: { id: string };
};

export type TabParamList = {
  Accueil: undefined;
  Carte: undefined;
  Favoris: undefined;
  Messages: undefined;
  Profil: undefined;
};
