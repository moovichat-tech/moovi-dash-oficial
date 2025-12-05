import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { loginWithPassword, checkUserHasPassword } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import mooviLogo from "@/assets/moovi-logo.png";

interface LoginPageProps {
  onSuccess: () => void;
  onFirstLogin: () => void;
  onForgotPassword: () => void;
}

// Format phone for display with mask
const formatPhoneNumber = (value: string): string => {
  let numbers = value.replace(/^\+55\s*\(?\s*/, "").replace(/\D/g, "");
  numbers = numbers.slice(0, 11);

  if (numbers.length === 0) {
    return "+55";
  } else if (numbers.length <= 2) {
    return `+55 (${numbers}`;
  } else if (numbers.length <= 6) {
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

// Extract only numbers with 55 prefix
const extractPhoneNumbers = (formatted: string): string => {
  const dddAndNumber = formatted.replace(/^\+55\s*\(?\s*/, "").replace(/\D/g, "");
  return "55" + dddAndNumber;
};

export function LoginPage({ onSuccess, onFirstLogin, onForgotPassword }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState("+55");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneOnly = extractPhoneNumbers(phoneNumber);

    // Basic validation
    if (phoneOnly.length < 12 || phoneOnly.length > 13) {
      toast({
        title: "Telefone inválido",
        description: "Digite um número de telefone válido com DDD.",
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
      const { hasPassword, exists } = await checkUserHasPassword(phoneOnly);

      if (!exists || !hasPassword) {
        toast({
          title: "Primeiro acesso necessário",
          description: "Você precisa fazer o primeiro login via WhatsApp para cadastrar sua senha.",
          variant: "destructive",
        });
        // Redirect to WhatsApp flow
        onFirstLogin();
        return;
      }

      // Try to login with password
      const { access_token, refresh_token } = await loginWithPassword(phoneOnly, password);

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
          description: "Faça o primeiro login via WhatsApp para criar sua senha.",
          variant: "destructive",
        });
        onFirstLogin();
        return;
      }

      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
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
          <CardDescription>
            Entre com seu número e senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+55 (62) 99150-9945"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && phoneNumber.length <= 3) {
                      e.preventDefault();
                    }
                  }}
                  className="pl-10"
                  disabled={loading}
                  maxLength={19}
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

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onFirstLogin}
              disabled={loading}
            >
              📲 Primeiro Login (código WhatsApp)
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={onForgotPassword}
              disabled={loading}
            >
              🔓 Esqueci minha senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
