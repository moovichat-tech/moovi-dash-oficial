import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendVerificationCode, verifyCode } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import mooviLogo from "@/assets/moovi-logo.png";

interface PhoneLoginProps {
  onSuccess: (jid: string, token: string, phoneNumber: string) => void;
}

// Função para formatar telefone brasileiro com máscara
const formatPhoneNumber = (value: string): string => {
  // Remove o prefixo +55 primeiro, DEPOIS extrai números
  let numbers = value.replace(/^\+55\s*\(?\s*/, "").replace(/\D/g, "");

  // Limita a 11 dígitos (DDD + número, SEM incluir o 55 do país)
  numbers = numbers.slice(0, 11);

  // Aplica máscara conforme o tamanho
  if (numbers.length === 0) {
    return "+55";
  } else if (numbers.length <= 2) {
    return `+55 (${numbers}`;
  } else if (numbers.length <= 6) {
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    // Celular: (XX) XXXXX-XXXX
    return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

// Função para extrair apenas os números (inclui 55 no início)
const extractPhoneNumbers = (formatted: string): string => {
  // Remove o prefixo +55 e extrai apenas DDD+número
  const dddAndNumber = formatted.replace(/^\+55\s*\(?\s*/, "").replace(/\D/g, "");
  // Retorna 55 + DDD + número completo
  return "55" + dddAndNumber;
};

export function PhoneLogin({ onSuccess }: PhoneLoginProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneNumber, setPhoneNumber] = useState("+55");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extrair números com código do país (55 + DDD + número)
    const phoneOnly = extractPhoneNumbers(phoneNumber);

    // Validação aprimorada: comprimento e formato brasileiro
    if (phoneOnly.length < 12 || phoneOnly.length > 13) {
      toast({
        title: "Telefone inválido",
        description: "Digite um número de telefone válido com DDD.",
        variant: "destructive",
      });
      return;
    }

    // Validação de formato: DDD válido (11-99) e número de celular (9XXXX-XXXX)
    const phoneRegex = /^55(1[1-9]|2[1-8]|3[1-5]|4[1-9]|5[1-5]|6[1-9]|7[1-9]|8[1-9]|9[1-9])[6-9]\d{7,8}$/;
    if (!phoneRegex.test(phoneOnly)) {
      toast({
        title: "Telefone inválido",
        description: "Digite seu número do whatsapp brasileiro válido com DDD.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Envia apenas os números (DDD + número)
      await sendVerificationCode(phoneOnly);
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
      // Usar apenas os números (sem +55)
      const phoneOnly = extractPhoneNumbers(phoneNumber);
      const { jid, token } = await verifyCode(phoneOnly, code);
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao Moovi.dash!",
      });
      onSuccess(jid, token, phoneOnly);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={mooviLogo} alt="Moovi" className="mx-auto mb-4" style={{ height: "60px" }} />
          <CardTitle className="text-2xl">Bem-vindo ao Moovi.dash</CardTitle>
          <CardDescription>
            {step === "phone"
              ? "Digite seu número do whatsapp brasileiro válido com DDD"
              : `Digite o código enviado para ${phoneNumber}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número do Whatsapp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+55 (62) 99150-9945"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setPhoneNumber(formatted);
                    }}
                    onKeyDown={(e) => {
                      // Impedir apagar o prefixo +55
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Código
              </Button>
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
