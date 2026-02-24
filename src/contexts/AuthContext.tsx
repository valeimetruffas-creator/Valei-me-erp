import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

interface UserData {
  uid: string;
  email: string | null;
  nome?: string;
  role?: string;
  empresaId?: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, "usuarios", firebaseUser.uid);
        const snap = await getDoc(ref);

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nome: snap.exists() ? snap.data().nome : "Usuário",
          role: snap.exists() ? snap.data().role : "funcionario",
          empresaId: snap.exists() ? snap.data().empresaId : undefined,
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
