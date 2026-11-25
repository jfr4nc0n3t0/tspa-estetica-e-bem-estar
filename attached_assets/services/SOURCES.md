# Fotos dos serviços

Todas as fotos do menu de cuidados e das experiências são do próprio TSpa (fornecidas pela proprietária). Não há mais imagens de banco de imagens no site.

Cada serviço tem uma pasta com o mesmo `id` usado em `client/src/data/services.ts`. O site carrega automaticamente todos os `.jpg` da pasta, em ordem alfabética.

**Nome dos arquivos:** `NN-descricao-da-foto.jpg` (ex.: `01-agua-no-pescoco-arco-dourado.jpg`). O número define a ordem na galeria e o `01` é a capa do card; a descrição diz o que aparece na foto. Para trocar ou adicionar fotos, basta incluir arquivos nesse formato na pasta, de preferência já recortados em 720×792 px (proporção do card).

| Pasta | Serviço |
| --- | --- |
| `head-spa-essencial/` | Head Spa Essencial |
| `head-spa-imersao/` | Head Spa Imersão |
| `head-spa-ritual/` | Head Spa Ritual |
| `massagem-relaxante/` | Massagem Relaxante |
| `drenagem-linfatica/` | Drenagem Linfática |
| `liberacao-miofascial/` | Liberação Miofascial |
| `hidratacao-facial/` | Hidratação Facial |
| `limpeza-de-pele/` | Limpeza de Pele |
| `ritual-dos-pes/` | Ritual dos Pés |

As Experiências TSpa (combos) não têm pasta própria: em `services.ts`, cada uma escolhe pelo nome algumas fotos dos serviços que compõem o combo, sem repetir fotos entre as experiências. **Se renomear uma foto usada em uma experiência, atualize o nome lá também** (o build avisa com erro se não encontrar a foto).
