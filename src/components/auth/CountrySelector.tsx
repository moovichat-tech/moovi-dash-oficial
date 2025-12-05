import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { countries, Country } from "@/data/countries";

interface CountrySelectorProps {
  value: Country;
  onChange: (country: Country) => void;
  disabled?: boolean;
}

export function CountrySelector({ value, onChange, disabled }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[120px] justify-between px-2 font-normal"
          disabled={disabled}
        >
          <span className="flex items-center gap-1.5 truncate">
            <img 
              src={`https://flagcdn.com/w40/${value.code.toLowerCase()}.png`}
              alt={value.name}
              className="h-4 w-6 object-cover rounded-sm"
            />
            <span className="text-sm">{value.dialCode}</span>
          </span>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 z-50 bg-popover" align="start">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandList>
            <CommandEmpty>País não encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.dialCode}`}
                  onSelect={() => {
                    onChange(country);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.code === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <img 
                    src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                    alt={country.name}
                    className="h-4 w-6 object-cover rounded-sm mr-2"
                  />
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    {country.dialCode}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
