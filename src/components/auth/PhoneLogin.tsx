import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendVerificationCode, verifyCode } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import mooviLogo from "@/assets/moovi-logo.png";
import { CountrySelector } from "./CountrySelector";
import { countries, Country } from "@/data/countries";

interface PhoneLoginProps {
  onSuccess: (jid: string, token: string, phoneNumber: string, needsPasswordSetup: boolean, refreshToken: string) => void;
  onBack?: () => void;
  isResetMode?: boolean;
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

export function PhoneLogin({ onSuccess, onBack, isResetMode = false }: PhoneLoginProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Brasil default
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullPhone = extractPhoneNumbers(phoneNumber, selectedCountry.dialCode);

    // Basic validation: minimum 8 digits (excluding country code)
    if (phoneNumber.length < 8) {
      toast({
        title: "Telefone inválido",
        description: "Digite um número de telefone válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await sendVerificationCode(fullPhone);
      setStep("code");
      toast({
        title: "Código enviado",
        description: "Verifique seu WhatsApp para o código de verificação.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar código",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fullPhone = extractPhoneNumbers(phoneNumber, selectedCountry.dialCode);
      const { jid, token, refreshToken, needsPasswordSetup } = await verifyCode(fullPhone, code);
      toast({
        title: "Verificação bem-sucedida!",
        description: isResetMode ? "Agora cadastre sua nova senha." : "Bem-vindo ao Moovi.dash!",
      });
      onSuccess(jid, token, fullPhone, isResetMode ? true : needsPasswordSetup, refreshToken);
    } catch (error) {
      toast({
        title: "Código inválido",
        description: "Verifique o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isResetMode) return "Recuperar Senha";
    return "Primeiro Login";
  };

  const getDescription = () => {
    if (step === "phone") {
      if (isResetMode) {
        return "Digite seu número para receber o código de verificação e criar uma nova senha";
      }
      return "Digite seu número do WhatsApp para receber o código de verificação";
    }
    return `Digite o código enviado para ${selectedCountry.dialCode} ${phoneNumber}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <img src={mooviLogo} alt="Moovi" className="mx-auto mb-4" style={{ height: "60px" }} />
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número do Whatsapp</Label>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Código
              </Button>
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onBack}
                  disabled={loading}
                >
                  Voltar para Login
                </Button>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10 text-center text-2xl tracking-widest"
                    disabled={loading}
                    maxLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verificar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("phone")}
                disabled={loading}
              >
                Voltar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
