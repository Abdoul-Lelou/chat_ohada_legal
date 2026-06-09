'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Scale, Loader2 } from 'lucide-react';
import { canAccessAdmin } from '@/lib/admin-access';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        const user = authData.user;
        if (user) {
          // Log login
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'login',
            details: { email }
          });

          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (canAccessAdmin({
            role: profile?.role,
            email: user.email,
            appMetadataRole: user.app_metadata?.role,
            userMetadataRole: user.user_metadata?.role,
          })) {
            router.push('/admin/users');
          } else {
            router.push('/');
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError("Veuillez vérifier votre email pour confirmer l'inscription.");
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Scale className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        <p className="text-gray-400">Assistant Juridique OHADA & Guinée</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-800">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Adresse Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 px-3 text-white shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 px-3 text-white shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className={`p-3 rounded-lg text-sm ${error.includes('vérifier') ? 'bg-blue-900/50 text-blue-200' : 'bg-red-900/50 text-red-200'}`}>
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center rounded-lg bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Se connecter' : 'S\'inscrire')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              {isLogin ? "Vous n'avez pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
