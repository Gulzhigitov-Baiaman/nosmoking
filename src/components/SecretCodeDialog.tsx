import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateSecretCode } from "@/hooks/usePremium";
import { useTranslation } from "react-i18next";

export const SecretCodeDialog = () => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateSecretCode(code)) {
      toast({
        title: "✅ Код принят!",
        description: "Премиум функции активированы. Перезагрузите страницу.",
      });
      setOpen(false);
      setCode("");
      
      // Reload page to refresh premium status
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast({
        title: "❌ Неверный код",
        description: "Пожалуйста, проверьте код и попробуйте снова.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="w-4 h-4 mr-2" />
          Секретный код
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Активация секретным кодом</DialogTitle>
          <DialogDescription>
            Введите секретный код для доступа к премиум функциям
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secret-code">Секретный код</Label>
            <Input
              id="secret-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введите код..."
              className="font-mono"
            />
          </div>
          <Button type="submit" className="w-full">
            Активировать
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};