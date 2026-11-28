-- Preços e tempos aprovados em novembro de 2026 (proposta de preços).
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez: só atualiza.
-- Acha cada serviço pelo nome, sem ligar para acentos e maiúsculas. Não mexe nos dados de exemplo.
-- No fim, mostra a lista: "atualizado" ou "NÃO ENCONTRADO" (nesse caso, confira o nome no painel).

with novos(name, price, duration_min) as (
  values
    ('Head Spa Essencial',   130,  30),
    ('Head Spa Imersão',     170,  45),
    ('Head Spa Ritual',      230,  60),
    ('Massagem Relaxante',   130,  60),
    ('Drenagem Linfática',   150,  60),
    ('Liberação Miofascial', 150,  60),
    ('Hidratação Facial',    110,  50),
    ('Limpeza de Pele',      120,  60),
    ('Ritual dos Pés',        55,  30),
    ('Ritual Leveza',        165,  90),
    ('Ritual Desacelerar',   205,  75),
    ('Ritual Pele Renovada', 205, 110),
    ('Ritual Conexão',       270, 105),
    ('Ritual TSpa',          345, 150)
),
atualizados as (
  update public.services s
     set price = n.price, duration_min = n.duration_min
    from novos n
   where public.name_key(s.name) = public.name_key(n.name)
     and not s.is_sample
  returning s.name, s.price, s.duration_min
)
select n.name as servico,
       coalesce(a.price, n.price) as preco,
       coalesce(a.duration_min, n.duration_min) as minutos,
       case when a.name is null then 'NÃO ENCONTRADO' else 'atualizado' end as situacao
  from novos n
  left join atualizados a on public.name_key(a.name) = public.name_key(n.name)
 order by (a.name is null) desc, n.name;
