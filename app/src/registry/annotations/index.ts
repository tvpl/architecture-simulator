import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";

const note: ServiceDefinition = {
  type: "note",
  label: "Anotação",
  description: "Adicione notas e comentários ao diagrama",
  category: "annotations",
  iconName: "StickyNote",
  color: "text-yellow-600",
  bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  borderColor: "border-yellow-400",
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: [],
  configSections: [
    {
      title: "Conteúdo",
      fields: [
        {
          kind: "text",
          key: "content",
          label: "Texto",
          placeholder: "Adicione uma anotação aqui...",
        },
        {
          kind: "select",
          key: "color",
          label: "Cor",
          options: [
            { value: "yellow", label: "Amarelo" },
            { value: "blue", label: "Azul" },
            { value: "green", label: "Verde" },
            { value: "pink", label: "Rosa" },
            { value: "purple", label: "Roxo" },
          ],
        },
      ],
    },
  ],
};

registry.register(note);
