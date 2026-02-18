import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Users, Trash2, Clock, Search, X } from "lucide-react";
import { toast } from "sonner";

interface Inscription {
  id: string;
  userId: string; // ID unique de l'utilisateur qui a créé l'inscription
  nom: string;
  filiere: string;
  niveau: string;
  telephone: string;
  dateInscription: string;
  heureInscription: string;
}

const MAX_INSCRIPTIONS = 50;

// Options disponibles pour les filtres
const FILIERES = [
  { value: "genie-logiciel", label: "Génie Logiciel" },
  { value: "reseau-securite", label: "Réseau et Sécurité" },
  { value: "iw", label: "IW" },
  { value: "cmn", label: "CMN" },
];

const NIVEAUX = [
  { value: "bts1", label: "BTS 1" },
  { value: "bts2", label: "BTS 2" },
  { value: "licence", label: "Licence" },
  { value: "master1", label: "Master 1" },
  { value: "master2", label: "Master 2" },
];

export default function Home() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [formData, setFormData] = useState({
    nom: "",
    filiere: "",
    niveau: "",
    telephone: "",
  });
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // États pour la recherche avancée
  const [searchNom, setSearchNom] = useState("");
  const [filterFiliere, setFilterFiliere] = useState<string>("");
  const [filterNiveau, setFilterNiveau] = useState<string>("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Initialiser l'ID utilisateur au montage
  useEffect(() => {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userId", userId);
    }
    setCurrentUserId(userId);
  }, []);

  // Charger les données depuis LocalStorage au montage
  useEffect(() => {
    const stored = localStorage.getItem("inscriptions");
    if (stored) {
      try {
        setInscriptions(JSON.parse(stored));
      } catch (error) {
        console.error("Erreur lors du chargement des inscriptions:", error);
      }
    }
  }, []);

  // Sauvegarder dans LocalStorage quand les inscriptions changent
  useEffect(() => {
    localStorage.setItem("inscriptions", JSON.stringify(inscriptions));
  }, [inscriptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      toast.error("Veuillez entrer votre nom complet");
      return false;
    }
    if (!formData.filiere) {
      toast.error("Veuillez sélectionner votre filière");
      return false;
    }
    if (!formData.niveau) {
      toast.error("Veuillez sélectionner votre niveau");
      return false;
    }
    // Validation du numéro de téléphone (Cameroun +237)
    const phoneRegex = /^(\+237|237)?[6][0-9]{8,9}$/;
    const cleanPhone = formData.telephone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      toast.error("Veuillez entrer un numéro de téléphone camerounais valide (+237 ou 6...)");
      return false;
    }
    // Vérifier les doublons
    if (inscriptions.some((insc) => insc.telephone === formData.telephone)) {
      toast.error("Ce numéro de téléphone est déjà inscrit");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (inscriptions.length >= MAX_INSCRIPTIONS) {
      toast.error(`Maximum d'inscriptions atteint (${MAX_INSCRIPTIONS})`);
      return;
    }

    setLoading(true);
    // Simuler un délai réseau
    await new Promise((resolve) => setTimeout(resolve, 500));

    const now = new Date();
    const dateInscription = now.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const heureInscription = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newInscription: Inscription = {
      id: `${Date.now()}-${Math.random()}`,
      userId: currentUserId,
      nom: formData.nom,
      filiere: formData.filiere,
      niveau: formData.niveau,
      telephone: formData.telephone,
      dateInscription,
      heureInscription,
    };

    setInscriptions((prev) => [newInscription, ...prev]);
    setFormData({ nom: "", filiere: "", niveau: "", telephone: "" });
    setLoading(false);

    toast.success("Inscription réussie ! 🎉");
  };

  const handleDelete = (id: string) => {
    // Vérifier que l'utilisateur supprime uniquement ses propres inscriptions
    const inscriptionToDelete = inscriptions.find((insc) => insc.id === id);
    if (!inscriptionToDelete) {
      toast.error("Inscription non trouvée");
      return;
    }
    if (inscriptionToDelete.userId !== currentUserId) {
      toast.error("Vous ne pouvez supprimer que vos propres inscriptions");
      return;
    }
    setInscriptions((prev) => prev.filter((insc) => insc.id !== id));
    toast.success("Inscription supprimée");
  };

  // Filtrage avancé avec useMemo pour optimisation
  const filteredInscriptions = useMemo(() => {
    return inscriptions.filter((insc) => {
      // Filtre par nom (recherche textuelle)
      const matchNom =
        searchNom === "" ||
        insc.nom.toLowerCase().includes(searchNom.toLowerCase()) ||
        insc.telephone.includes(searchNom);

      // Filtre par filière
      const matchFiliere = filterFiliere === "" || insc.filiere === filterFiliere;

      // Filtre par niveau
      const matchNiveau = filterNiveau === "" || insc.niveau === filterNiveau;

      return matchNom && matchFiliere && matchNiveau;
    });
  }, [inscriptions, searchNom, filterFiliere, filterNiveau]);

  const isListFull = inscriptions.length >= MAX_INSCRIPTIONS;

  // Fonction pour obtenir le label d'une filière
  const getFiliereLabel = (value: string) => {
    return FILIERES.find((f) => f.value === value)?.label || value;
  };

  // Fonction pour obtenir le label d'un niveau
  const getNiveauLabel = (value: string) => {
    return NIVEAUX.find((n) => n.value === value)?.label || value;
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchNom !== "" || filterFiliere !== "" || filterNiveau !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Club Informatique
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Visite Académique ISTC - Institut ROCCAD
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-slate-900">
                  {inscriptions.length}
                </span>
                <span className="text-sm text-slate-600">/ {MAX_INSCRIPTIONS}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg border-slate-200/50 bg-white/95 backdrop-blur">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  S'inscrire
                </h2>

                {isListFull && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Les inscriptions sont complètes
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom complet
                    </label>
                    <Input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      placeholder="Jean Dupont"
                      disabled={isListFull || loading}
                      className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Filière
                    </label>
                    <Select
                      value={formData.filiere}
                      onValueChange={(value) =>
                        handleSelectChange("filiere", value)
                      }
                      disabled={isListFull || loading}
                    >
                      <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Choisir une filière" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILIERES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Niveau
                    </label>
                    <Select
                      value={formData.niveau}
                      onValueChange={(value) =>
                        handleSelectChange("niveau", value)
                      }
                      disabled={isListFull || loading}
                    >
                      <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Choisir un niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEAUX.map((n) => (
                          <SelectItem key={n.value} value={n.value}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Téléphone
                    </label>
                    <Input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      placeholder="+237 6XX XXX XXX"
                      disabled={isListFull || loading}
                      className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isListFull || loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-medium py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Inscription en cours..." : "S'inscrire"}
                  </Button>
                </form>

                {isListFull && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Limite d'inscriptions atteinte
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Liste des inscrits avec recherche avancée */}
          <div className="lg:col-span-2">
            {/* Bouton pour afficher/masquer la recherche avancée */}
            <div className="mb-6">
              <Button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                variant="outline"
                className="w-full mb-4 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {showAdvancedSearch ? "Masquer" : "Afficher"} la recherche avancée
              </Button>

              {/* Recherche avancée */}
              {showAdvancedSearch && (
                <Card className="p-4 border-slate-200/50 bg-white/95 backdrop-blur mb-6">
                  <div className="space-y-4">
                    {/* Recherche par nom/téléphone */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Rechercher par nom ou téléphone
                      </label>
                      <Input
                        type="text"
                        placeholder="Entrez un nom ou un numéro..."
                        value={searchNom}
                        onChange={(e) => setSearchNom(e.target.value)}
                        className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Filtre par filière */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Filière
                      </label>
                      <Select
                        value={filterFiliere || "all"}
                        onValueChange={(value) => setFilterFiliere(value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Toutes les filières" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les filières</SelectItem>
                          {FILIERES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtre par niveau */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Niveau
                      </label>
                      <Select
                        value={filterNiveau || "all"}
                        onValueChange={(value) => setFilterNiveau(value === "all" ? "" : value)}
                      >
                        <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Tous les niveaux" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les niveaux</SelectItem>
                          {NIVEAUX.map((n) => (
                            <SelectItem key={n.value} value={n.value}>
                              {n.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bouton pour réinitialiser les filtres */}
                    {hasActiveFilters && (
                      <Button
                        onClick={() => {
                          setSearchNom("");
                          setFilterFiliere("");
                          setFilterNiveau("");
                        }}
                        variant="outline"
                        className="w-full border-slate-200 hover:bg-red-50 text-slate-700 flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Affichage des filtres actifs */}
              {hasActiveFilters && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Filtres actifs :</span>
                    {searchNom && ` Nom/Tél: "${searchNom}"`}
                    {filterFiliere && ` • Filière: "${getFiliereLabel(filterFiliere)}"`}
                    {filterNiveau && ` • Niveau: "${getNiveauLabel(filterNiveau)}"`}
                  </p>
                </div>
              )}
            </div>

            {/* Liste des inscrits */}
            {inscriptions.length === 0 ? (
              <Card className="p-12 text-center border-slate-200/50 bg-white/95">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">
                  Aucune inscription pour le moment
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Soyez le premier à vous inscrire !
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredInscriptions.length === 0 ? (
                  <Card className="p-8 text-center border-slate-200/50 bg-white/95">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">
                      Aucun résultat ne correspond à vos critères
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Essayez de modifier vos filtres de recherche
                    </p>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-slate-700">
                        {filteredInscriptions.length} résultat(s)
                        {hasActiveFilters && ` (sur ${inscriptions.length} total)`}
                      </p>
                    </div>
                    {filteredInscriptions.map((insc, index) => (
                      <Card
                        key={insc.id}
                        className="p-4 border-slate-200/50 bg-white hover:shadow-md transition-shadow duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </span>
                              <h3 className="font-semibold text-slate-900 truncate">
                                {insc.nom}
                              </h3>
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div>
                                <span className="text-slate-500">Filière:</span>
                                <p className="text-slate-900 font-medium">
                                  {getFiliereLabel(insc.filiere)}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">Niveau:</span>
                                <p className="text-slate-900 font-medium">
                                  {getNiveauLabel(insc.niveau)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-600">
                              <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                                {insc.telephone}
                              </span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {insc.dateInscription} à {insc.heureInscription}
                                </span>
                              </div>
                            </div>
                          </div>

                          {insc.userId === currentUserId && (
                            <button
                              onClick={() => handleDelete(insc.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                              title="Supprimer votre inscription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {insc.userId !== currentUserId && (
                            <div className="p-2 text-slate-300 flex-shrink-0" title="Vous ne pouvez pas supprimer cette inscription">
                              <Trash2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}

            {inscriptions.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">{inscriptions.length}</span> inscrit(s)
                  {inscriptions.length >= MAX_INSCRIPTIONS * 0.8 && (
                    <span className="ml-2">
                      ({Math.round((inscriptions.length / MAX_INSCRIPTIONS) * 100)}% de la
                      capacité)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/50 backdrop-blur-sm mt-16">
        <div className="container py-6 text-center text-sm text-slate-600">
          <p>
            Visite Académique ISTC - Institut Universitaire ROCCAD 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
