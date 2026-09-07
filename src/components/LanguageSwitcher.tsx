import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, type LanguageCode } from "@/lib/artisan";
import { useLanguage } from "@/lib/i18n";

/** Switches the interface language and saves the choice to the artisan's profile. */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-label={t("nav.language")}>
          <Globe className="h-4 w-4" aria-hidden />
          <span className="text-xs font-medium">{current.native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as LanguageCode)}
            className={lang.code === language ? "font-semibold" : undefined}
          >
            {lang.native}
            <span className="text-muted-foreground ml-2 text-xs">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
