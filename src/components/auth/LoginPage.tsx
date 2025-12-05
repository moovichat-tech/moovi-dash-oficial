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

// Format phone number with mask based on country
const formatPhoneWithMask = (value: string, countryCode: string): string => {
  const digits = value.replace(/\D/g, "");
  
  if (countryCode === "BR") {
    // Brasil: (11) 99150-9945
    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : "";
    }
    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // Celular 9 dígitos
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  
  if (countryCode === "US" || countryCode === "CA") {
    // EUA/Canadá: (555) 123-4567
    if (digits.length <= 3) {
      return digits.length ? `(${digits}` : "";
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  
  // Outros países: agrupa em blocos
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
};

// Get placeholder based on country
const getPlaceholder = (countryCode: string): string => {
  switch (countryCode) {
    case "BR":
      return "(11) 99150-9945";
    case "US":
    case "CA":
      return "(555) 123-4567";
    default:
      return "123 456 789";
  }
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

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    // Re-apply mask of new country to existing number
    const digits = phoneNumber.replace(/\D/g, "");
    setPhoneNumber(formatPhoneWithMask(digits, country.code));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullPhone = extractPhoneNumbers(phoneNumber, selectedCountry.dialCode);
    const digitsOnly = phoneNumber.replace(/\D/g, "");

    // Basic validation: minimum 8 digits
    if (digitsOnly.length < 8) {
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
      const { hasPassword } = await checkUserHasPassword(fullPhone);

      if (!hasPassword) {
        toast({
          title: "Senha não cadastrada",
          description: "Você ainda não cadastrou sua senha. Clique no botão 'Primeiro Login' para criar sua conta.",
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
                  onChange={handleCountryChange}
                  disabled={loading}
                />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={getPlaceholder(selectedCountry.code)}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneWithMask(e.target.value, selectedCountry.code))}
                  className="flex-1"
                  disabled={loading}
                  maxLength={20}
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
