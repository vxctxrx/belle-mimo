-- Ativar Row Level Security (Segurança em Nível de Linha) em todas as tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE "siteTexts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "siteImages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE prints ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Leitura (SELECT) para o Público Geral
-- Qualquer pessoa que acessar o site pode ler os produtos, textos, imagens e avaliações.
CREATE POLICY "Leitura publica de produtos" ON products FOR SELECT USING (true);
CREATE POLICY "Leitura publica de textos" ON "siteTexts" FOR SELECT USING (true);
CREATE POLICY "Leitura publica de imagens" ON "siteImages" FOR SELECT USING (true);
CREATE POLICY "Leitura publica de depoimentos" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Leitura publica de estampas" ON prints FOR SELECT USING (true);

-- 2. Políticas de Edição/Criação/Exclusão APENAS para Administradores (Usuários Logados)
-- Apenas usuários autenticados no painel podem alterar os dados.

-- Produtos
CREATE POLICY "Admins podem inserir produtos" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins podem editar produtos" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins podem deletar produtos" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Textos do Site
CREATE POLICY "Admins podem inserir textos" ON "siteTexts" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins podem editar textos" ON "siteTexts" FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins podem deletar textos" ON "siteTexts" FOR DELETE USING (auth.role() = 'authenticated');

-- Imagens do Site
CREATE POLICY "Admins podem inserir imagens" ON "siteImages" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins podem editar imagens" ON "siteImages" FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins podem deletar imagens" ON "siteImages" FOR DELETE USING (auth.role() = 'authenticated');

-- Avaliações
CREATE POLICY "Admins podem inserir avaliações" ON testimonials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins podem editar avaliações" ON testimonials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins podem deletar avaliações" ON testimonials FOR DELETE USING (auth.role() = 'authenticated');

-- Estampas
CREATE POLICY "Admins podem inserir estampas" ON prints FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins podem editar estampas" ON prints FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins podem deletar estampas" ON prints FOR DELETE USING (auth.role() = 'authenticated');
