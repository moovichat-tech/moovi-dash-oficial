import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { PasswordStrengthIndicator, isPasswordValid } from "./PasswordStrengthIndicator";
import { setUserPassword } from "@/services/api";
import mooviLogo from "@/assets/moovi-logo.png";

interface RegisterPasswordProps {
  phoneNumber: string;
  onSuccess: () => void;
  onBack: () => void;
}

// Format phone for display
const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 12) return phone;
  
  const ddd = digits.slice(2, 4);
  const part1 = digits.slice(4, 9);
  const part2 = digits.slice(9, 13);
  
  return `+55 (${ddd}) ${part1}-${part2}`;
};

export function RegisterPassword({ phoneNumber, onSuccess, onBack }: RegisterPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid(password)) {
      toast({
        title: "Senha fraca",
        description: "Complete todos os requisitos de senha.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas são diferentes.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await setUserPassword(password);
      toast({
        title: "Senha cadastrada!",
        description: "Agora você pode fazer login com sua senha.",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar senha",
        description: error instanceof Error ? error.message : "Tente novamente.",
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
          <CardTitle className="text-2xl">Criar Senha</CardTitle>
          <CardDescription>
            Cadastre uma senha para acessar sua conta mais rapidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone number (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formatPhoneDisplay(phoneNumber)}
                  className="pl-10 bg-muted"
                  disabled
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            <PasswordStrengthIndicator 
              password={password} 
              confirmPassword={confirmPassword}
              showConfirmMatch={true}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isPasswordValid(password) || password !== confirmPassword}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Senha
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={loading}
            >
              Voltar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
