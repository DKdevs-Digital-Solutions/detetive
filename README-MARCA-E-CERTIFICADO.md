# Identidade visual e certificado

O pacote já inclui a identidade do Colégio Monsenhor Raeder e o novo certificado padrão.

## Arquivos adicionados

- `public/logo-raeder-pb.png`: logo branca usada no front-end.
- `public/logo-raeder-colorida.png`: logo colorida usada no certificado.
- `public/certificado-modelo.pdf`: arte fixa sem o nome.
- `public/certificado-exemplo.pdf`: prévia com um nome demonstrativo.

## Como o certificado funciona

A função `src/lib/certificate.ts` abre o arquivo `public/certificado-modelo.pdf` e escreve somente o nome do participante na linha central. O restante do certificado não é redesenhado durante cada emissão.

Para trocar o layout futuramente, mantenha o arquivo com o nome `certificado-modelo.pdf` e preserve a área do nome na mesma posição. Caso a posição seja alterada, ajuste `NAME_BASELINE` em `src/lib/certificate.ts`.

## Acesso oculto ao menu

O acesso administrativo continua sendo feito ao manter pressionada a logo branca do Colégio, na barra superior, por 3 segundos.
