import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Persona {
  id: string;
  name: string;
  image: string | null;
  iteratedImage: string | null;
}

interface PersonaContextType {
  personas: Persona[];
  currentPersona: Persona | null;
  addPersona: () => void;
  deletePersona: (id: string) => void;
  setCurrentPersona: (id: string) => void;
  updatePersonaImage: (id: string, image: string) => void;
  updateIteratedImage: (id: string, image: string) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};

interface PersonaProviderProps {
  children: ReactNode;
}

export const PersonaProvider: React.FC<PersonaProviderProps> = ({ children }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPersona, setCurrentPersonaState] = useState<Persona | null>(null);

  const addPersona = () => {
    const newPersona: Persona = {
      id: `persona-${Date.now()}`,
      name: `Persona ${personas.length + 1}`,
      image: null,
      iteratedImage: null
    };
    
    setPersonas([...personas, newPersona]);
    setCurrentPersonaState(newPersona);
  };

  const deletePersona = (id: string) => {
    // Filter out the persona with the given id
    const updatedPersonas = personas.filter(p => p.id !== id);
    setPersonas(updatedPersonas);
    
    // If the deleted persona was the current one, set a new current persona or null
    if (currentPersona?.id === id) {
      const newCurrentPersona = updatedPersonas.length > 0 ? updatedPersonas[0] : null;
      setCurrentPersonaState(newCurrentPersona);
    }
  };

  const setCurrentPersona = (id: string) => {
    const persona = personas.find(p => p.id === id) || null;
    setCurrentPersonaState(persona);
  };

  const updatePersonaImage = (id: string, image: string) => {
    setPersonas(personas.map(p => 
      p.id === id ? { ...p, image } : p
    ));
    
    if (currentPersona?.id === id) {
      setCurrentPersonaState({ ...currentPersona, image });
    }
  };

  const updateIteratedImage = (id: string, iteratedImage: string) => {
    setPersonas(personas.map(p => 
      p.id === id ? { ...p, iteratedImage } : p
    ));
    
    if (currentPersona?.id === id) {
      setCurrentPersonaState({ ...currentPersona, iteratedImage });
    }
  };

  return (
    <PersonaContext.Provider value={{
      personas,
      currentPersona,
      addPersona,
      deletePersona,
      setCurrentPersona,
      updatePersonaImage,
      updateIteratedImage
    }}>
      {children}
    </PersonaContext.Provider>
  );
}; 