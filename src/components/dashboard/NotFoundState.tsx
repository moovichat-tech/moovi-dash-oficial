import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, MessageCircle, LogOut } from 'lucide-react';
import mooviMascot from '@/assets/moovi-mascot.png';

interface NotFoundStateProps {
  onLogout?: () => void;
}

export function NotFoundState({ onLogout }: NotFoundStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <img src={mooviMascot} alt="Moovi" className="h-24 mx-auto mb-4" />
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-warning" />
            Dashboard Não Configurado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Ainda não encontramos dados do seu dashboard. Configure-o primeiro através do Moovi!
          </p>
          
          <div className="space-y-2">
            {onLogout && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            )}
            <Button
              variant="default"
              className="w-full"
              asChild
            >
              <a
                href="https://wa.me/5511989269937"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar com Suporte
              </a>
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <a
                href="https://moovi.chat"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Conhecer o Moovi
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
