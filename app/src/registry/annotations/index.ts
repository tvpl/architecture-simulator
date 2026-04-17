import { registry } from "../index-internal";
import type { ServiceDefinition } from "../types";
import type { SelectField } from "../types";

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

const region: ServiceDefinition = {
  type: "region",
  label: "AWS Region",
  description: "Agrupa recursos em uma região AWS",
  category: "annotations",
  iconName: "Globe2",
  color: "text-indigo-600",
  bgColor: "bg-indigo-500/10",
  borderColor: "border-indigo-500/40",
  allowedIncomingProtocols: [],
  allowedOutgoingProtocols: [],
  configSections: [
    {
      title: "Região",
      fields: [
        {
          kind: "select",
          key: "regionCode",
          label: "Código da Região",
          options: [
            { label: "us-east-1 (N. Virginia)", value: "us-east-1" },
            { label: "us-east-2 (Ohio)", value: "us-east-2" },
            { label: "us-west-1 (N. California)", value: "us-west-1" },
            { label: "us-west-2 (Oregon)", value: "us-west-2" },
            { label: "eu-west-1 (Ireland)", value: "eu-west-1" },
            { label: "eu-west-2 (London)", value: "eu-west-2" },
            { label: "eu-central-1 (Frankfurt)", value: "eu-central-1" },
            { label: "ap-southeast-1 (Singapore)", value: "ap-southeast-1" },
            { label: "ap-southeast-2 (Sydney)", value: "ap-southeast-2" },
            { label: "ap-northeast-1 (Tokyo)", value: "ap-northeast-1" },
            { label: "sa-east-1 (São Paulo)", value: "sa-east-1" },
          ],
        } as SelectField,
      ],
    },
  ],
};

registry.register(region);
