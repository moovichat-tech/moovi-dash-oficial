import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendVerificationCode, verifyCode } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Loader2, Phone, ShieldCheck } from 'lucide-react';
import mooviLogo from '@/assets/moovi-logo.png';

interface PhoneLoginProps {
  onSuccess: (jid: string, token: string) => void;
}

// Função para formatar telefone brasileiro com máscara
const formatPhoneNumber = (value: string): string => {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos (DDD + número)
  const limited = numbers.slice(0, 11);
  
  // Aplica máscara conforme o tamanho
  if (limited.length <= 2) {
    return `+55 (${limited}`;
  } else if (limited.length <= 6) {
    return `+55 (${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return `+55 (${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  } else {
    // Celular: (XX) XXXXX-XXXX
    return `+55 (${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`;
  }
};

// Função para extrair apenas os números (sem +55)
const extractPhoneNumbers = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

export function PhoneLogin({ onSuccess }: PhoneLoginProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+55 (');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extrair apenas números (sem o +55)
    const phoneOnly = extractPhoneNumbers(phoneNumber);
    
    // Validação: deve ter 10 (fixo) ou 11 (celular) dígitos
    if (phoneOnly.length < 10 || phoneOnly.length > 11) {
      toast({
        title: 'Telefone inválido',
        description: 'Digite um número de telefone válido com DDD.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Envia apenas os números (DDD + número)
      await sendVerificationCode(phoneOnly);
      setStep('code');
      toast({
        title: 'Código enviado',
        description: 'Verifique seu WhatsApp para o código de verificação.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar código',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'O código deve ter 6 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Usar apenas os números (sem +55)
      const phoneOnly = extractPhoneNumbers(phoneNumber);
      const { jid, token } = await verifyCode(phoneOnly, code);
      toast({
        title: 'Login bem-sucedido',
        description: 'Bem-vindo ao Moovi.dash!',
      });
      onSuccess(jid, token);
    } catch (error) {
      toast({
        title: 'Código inválido',
        description: 'Verifique o código e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={mooviLogo} alt="Moovi" className="h-12 mx-auto mb-4" />
          <CardTitle className="text-2xl">Bem-vindo ao Moovi.dash</CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Digite seu telefone para receber o código de verificação'
              : `Digite o código enviado para ${phoneNumber}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telefone</Label>
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
                      if (e.key === 'Backspace' && phoneNumber.length <= 5) {
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
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                onClick={() => setStep('phone')}
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
