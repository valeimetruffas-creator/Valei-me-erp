export type ColecaoConfiguracao = "configuracoes" | "integracoes" | "entregas" | "automacoes";

export type ModuloConfiguracaoKey =
  | "motoboys"
  | "automacaoWhatsapp"
  | "integracaoIfood"
  | "emissaoNotaFiscal"
  | "impressaoSegmentada"
  | "cidadesEntrega"
  | "bloqueioCliente"
  | "automacaoInstagram"
  | "mapaMesas"
  | "sugestaoImpressoras"
  | "integracoesApiAberta"
  | "integracaoParceirosLogistica";

export interface BaseConfiguracaoModulo {
  ativo: boolean;
  atualizadoEm?: string;
  atualizadoPor?: string;
}

export interface ConfiguracaoMotoboys extends BaseConfiguracaoModulo {
  taxaPadraoEntrega: number;
  tempoMedioEntregaMinutos: number;
  distanciaMaximaKm: number;
  aceitaTerceirizados: boolean;
}

export interface ConfiguracaoAutomacaoWhatsapp extends BaseConfiguracaoModulo {
  enviarConfirmacaoPedido: boolean;
  enviarAtualizacaoStatus: boolean;
  templateMensagemBoasVindas: string;
  numeroRemetente: string;
}

export interface ConfiguracaoIntegracaoIfood extends BaseConfiguracaoModulo {
  merchantId: string;
  clientId: string;
  webhookUrl: string;
  sincronizarCardapioAutomatico: boolean;
  sincronizarEstoqueAutomatico: boolean;
}

export interface ConfiguracaoEmissaoNotaFiscal extends BaseConfiguracaoModulo {
  ambiente: "homologacao" | "producao";
  serieNfce: string;
  proximoNumero: number;
  cscTokenId: string;
  cscCodigo: string;
}

export interface ConfiguracaoImpressaoSegmentada extends BaseConfiguracaoModulo {
  imprimirCozinha: boolean;
  imprimirBar: boolean;
  imprimirCaixa: boolean;
  copiasPadrao: number;
}

export interface ConfiguracaoCidadesEntrega extends BaseConfiguracaoModulo {
  cidadesAtendidas: string;
  raioPadraoKm: number;
  valorMinimoPedido: number;
  taxaEntregaBase: number;
}

export interface ConfiguracaoBloqueioCliente extends BaseConfiguracaoModulo {
  bloquearInadimplentesAutomaticamente: boolean;
  diasParaBloqueio: number;
  bloquearPorFraude: boolean;
  motivoPadraoBloqueio: string;
}

export interface ConfiguracaoAutomacaoInstagram extends BaseConfiguracaoModulo {
  responderComentariosAutomaticamente: boolean;
  responderDirectAutomaticamente: boolean;
  mensagemRespostaPadrao: string;
  horarioAtendimento: string;
}

export interface ConfiguracaoMapaMesas extends BaseConfiguracaoModulo {
  totalMesas: number;
  setores: string;
  controleComandasAtivo: boolean;
  tempoLimiteOcupacaoMinutos: number;
}

export interface ConfiguracaoSugestaoImpressoras extends BaseConfiguracaoModulo {
  fabricantePreferencial: string;
  larguraPapelMm: 58 | 80;
  conexaoPreferencial: "usb" | "rede" | "bluetooth";
  habilitarDescobertaAutomatica: boolean;
}

export interface ConfiguracaoIntegracaoApiAberta extends BaseConfiguracaoModulo {
  apiPublicaAtiva: boolean;
  urlBaseApi: string;
  exigirAssinaturaWebhook: boolean;
  versaoApi: string;
}

export interface ConfiguracaoIntegracaoParceirosLogistica extends BaseConfiguracaoModulo {
  integrar99Food: boolean;
  integrar99Entregas: boolean;
  integrarUberDirect: boolean;
  prioridadeRoteamento: "interno" | "99entregas" | "uberdirect";
}

export interface ConfiguracaoPorModulo {
  motoboys: ConfiguracaoMotoboys;
  automacaoWhatsapp: ConfiguracaoAutomacaoWhatsapp;
  integracaoIfood: ConfiguracaoIntegracaoIfood;
  emissaoNotaFiscal: ConfiguracaoEmissaoNotaFiscal;
  impressaoSegmentada: ConfiguracaoImpressaoSegmentada;
  cidadesEntrega: ConfiguracaoCidadesEntrega;
  bloqueioCliente: ConfiguracaoBloqueioCliente;
  automacaoInstagram: ConfiguracaoAutomacaoInstagram;
  mapaMesas: ConfiguracaoMapaMesas;
  sugestaoImpressoras: ConfiguracaoSugestaoImpressoras;
  integracoesApiAberta: ConfiguracaoIntegracaoApiAberta;
  integracaoParceirosLogistica: ConfiguracaoIntegracaoParceirosLogistica;
}

export type ValorConfiguracaoModulo<K extends ModuloConfiguracaoKey> = ConfiguracaoPorModulo[K];

export interface DefinicaoModuloConfiguracao {
  chave: ModuloConfiguracaoKey;
  titulo: string;
  descricao: string;
  colecao: ColecaoConfiguracao;
  rota: string;
}

export const MODULOS_CONFIGURACAO: DefinicaoModuloConfiguracao[] = [
  {
    chave: "motoboys",
    titulo: "Motoboys",
    descricao: "Operação de entrega própria e terceirizada",
    colecao: "entregas",
    rota: "/configuracoes/motoboys",
  },
  {
    chave: "automacaoWhatsapp",
    titulo: "Automação WhatsApp",
    descricao: "Mensagens automáticas para jornada do pedido",
    colecao: "automacoes",
    rota: "/configuracoes/automacao-whatsapp",
  },
  {
    chave: "integracaoIfood",
    titulo: "Integração iFood",
    descricao: "Conexão com marketplace e sincronização operacional",
    colecao: "integracoes",
    rota: "/configuracoes/integracao-ifood",
  },
  {
    chave: "emissaoNotaFiscal",
    titulo: "Emissão de nota fiscal",
    descricao: "Configuração de NFC-e e parâmetros fiscais",
    colecao: "configuracoes",
    rota: "/configuracoes/emissao-nota-fiscal",
  },
  {
    chave: "impressaoSegmentada",
    titulo: "Impressão segmentada",
    descricao: "Roteamento de impressão por setor",
    colecao: "configuracoes",
    rota: "/configuracoes/impressao-segmentada",
  },
  {
    chave: "cidadesEntrega",
    titulo: "Configuração de cidades",
    descricao: "Raio, taxa e política de entrega por localidade",
    colecao: "entregas",
    rota: "/configuracoes/cidades-entrega",
  },
  {
    chave: "bloqueioCliente",
    titulo: "Bloquear cliente",
    descricao: "Política automática de bloqueio e segurança",
    colecao: "configuracoes",
    rota: "/configuracoes/bloqueio-cliente",
  },
  {
    chave: "automacaoInstagram",
    titulo: "Automação Instagram",
    descricao: "Automação de mensagens para atendimento social",
    colecao: "automacoes",
    rota: "/configuracoes/automacao-instagram",
  },
  {
    chave: "mapaMesas",
    titulo: "Mapa de mesas",
    descricao: "Layout de salão e controle de ocupação",
    colecao: "configuracoes",
    rota: "/configuracoes/mapa-mesas",
  },
  {
    chave: "sugestaoImpressoras",
    titulo: "Sugestão de impressoras",
    descricao: "Regras de recomendação para impressão térmica",
    colecao: "configuracoes",
    rota: "/configuracoes/sugestao-impressoras",
  },
  {
    chave: "integracoesApiAberta",
    titulo: "Integrações / API aberta",
    descricao: "Gateway de integrações externas e webhooks",
    colecao: "integracoes",
    rota: "/configuracoes/integracoes-api",
  },
  {
    chave: "integracaoParceirosLogistica",
    titulo: "Integração 99Food / 99Entregas / Uber",
    descricao: "Conectores para parceiros de logística e delivery",
    colecao: "integracoes",
    rota: "/configuracoes/integracao-parceiros",
  },
];

export function obterDefinicaoModulo(chave: ModuloConfiguracaoKey): DefinicaoModuloConfiguracao {
  const definicao = MODULOS_CONFIGURACAO.find((modulo) => modulo.chave === chave);
  if (!definicao) {
    throw new Error(`Módulo não encontrado: ${chave}`);
  }
  return definicao;
}
