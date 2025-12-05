import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { loginWithPassword, checkUserHasPassword } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import mooviLogo from "@/assets/moovi-logo.png";
import { CountrySelector } from "./CountrySelector";
import { countries, Country } from "@/data/countries";

interface LoginPageProps {
  onSuccess: () => void;
  onFirstLogin: () => void;
  onForgotPassword: () => void;
}

// Format phone number - just keeps digits
const formatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 15);
};

// Extract full phone number with country dial code
const extractPhoneNumbers = (phoneNumber: string, dialCode: string): string => {
  const cleanDialCode = dialCode.replace(/\D/g, "");
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  return cleanDialCode + cleanNumber;
};

export function LoginPage({ onSuccess, onFirstLogin, onForgotPassword }: LoginPageProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Brasil default
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullPhone = extractPhoneNumbers(phoneNumber, selectedCountry.dialCode);

    // Basic validation: minimum 8 digits
    if (phoneNumber.length < 8) {
      toast({
        title: "Telefone inválido",
        description: "Digite um número de telefone válido.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter no mínimo 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First check if user has password set
      const { hasPassword, exists } = await checkUserHasPassword(fullPhone);

      if (!exists || !hasPassword) {
        toast({
          title: "Conta não encontrada",
          description: "Você ainda não tem login. Clique no botão 'Primeiro Login' para criar sua conta.",
          variant: "destructive",
        });
        return;
      }

      // Try to login with password
      const { access_token, refresh_token } = await loginWithPassword(fullPhone, password);

      // Set session in Supabase
      await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo ao Moovi.dash!",
      });

      onSuccess();
    } catch (error: any) {
      if (error.needsWhatsApp) {
        toast({
          title: "Senha não cadastrada",
          description: "Você ainda não tem senha. Clique no botão 'Primeiro Login' para criar sua conta.",
          variant: "destructive",
        });
        return;
      }

      const errorMessage = error.message || "";
      const isInvalidPassword =
        errorMessage.toLowerCase().includes("credenciais inválidas") ||
        errorMessage.toLowerCase().includes("invalid") ||
        error.status === 401;

      if (isInvalidPassword) {
        toast({
          title: "Senha incorreta",
          description: "A senha digitada está incorreta. Se esqueceu sua senha, clique em 'Esqueci minha senha'.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no login",
          description: errorMessage || "Ocorreu um erro ao fazer login. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={mooviLogo} alt="Moovi" className="mx-auto mb-4" style={{ height: "60px" }} />
          <CardTitle className="text-2xl">Bem-vindo ao Moovi.dash</CardTitle>
          <CardDescription>Entre com seu número e senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <div className="flex gap-2">
                <CountrySelector
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  disabled={loading}
                />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="99150-9945"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  className="flex-1"
                  disabled={loading}
                  maxLength={15}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={onFirstLogin} disabled={loading}>
              Primeiro Login (código WhatsApp)
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={onForgotPassword}
              disabled={loading}
            >
              Esqueci minha senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
