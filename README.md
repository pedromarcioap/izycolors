# IzyColors 🎨

A comprehensive chromatic workstation built for designers, illustrators, and front-end developers. **IzyColors** bridges fast procedural palette generation, mathematical harmony models, advanced color space conversions, and strict accessibility auditing into a single interface.

---

## ⚡ Core Features

- **Rapid Procedural Generator:** Instant generation via spacebar with column locking, drag-and-drop reordering, and shade inspection[cite: 1].
- **Harmonic Color Wheel:** Rule-based color harmonies including analogous, monochromatic, triadic, complementary, and split-complementary schemes[cite: 1].
- **Color Space Lab:** Real-time color space conversions across RGB, HEX, HSL, HSV, CMYK, LAB, and LCH, paired with perceptual gradient interpolation[cite: 1].
- **Image Palette Extractor:** Quantized sampling to extract dominant tones from uploaded images with automatic contrast verification[cite: 1].
- **Accessibility & Contrast Suite (WCAG 2.1):** AA and AAA contrast ratio checks, plus color vision deficiency simulation filters (Protanopia, Deuteranopia, Tritanopia, and Achromatopsia)[cite: 1].
- **Projects & Collections Vault:** Dedicated workspaces to organize semantic design tokens by brand or interface, along with individual color swatch saves[cite: 1].
- **Multi-Format Export:** Direct export to CSS custom properties, Tailwind configuration, JSON, and SVG[cite: 1].
- **Integrated Community & CMS:** Curated public palette feed, individual user profiles, and administrative moderation tools[cite: 1].

---

## 🛠️ Tech Stack

- **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)[cite: 1]
- **Language:** [TypeScript](https://www.typescriptlang.org/)[cite: 1]
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)[cite: 1]
- **Backend / Database / Auth:** [Supabase](https://supabase.com/)[cite: 1]
- **Icons:** [Lucide React](https://lucide.dev/)[cite: 1]

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) or Bun[cite: 1]
- Package manager (npm, pnpm, or bun)[cite: 1]

### Installation

1. Clone the repository:
bash
git clone [https://github.com/pedromarcioap/izycolors.git](https://github.com/pedromarcioap/izycolors.git)
cd izycolors

Install dependencies:
Bash
npm install
# or
bun install

Configure environment variables:
Create a .env file in the root folder based on .env.example[cite: 1]:

Code snippet

VITE_SUPABASE_URL=your-supabase-url

VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

Run the development server:

Bash
npm run dev
# or
bun dev
Open http://localhost:5173 in your browser.

## 🗄️ Backend (Supabase)

Não existe mais mock: **toda** persistência acontece no Postgres, com a RLS do
banco decidindo o que cada sessão pode ler e escrever.

- **Tabelas** (`supabase/migrations/`) — `profiles`, `palettes`, `palette_likes`,
  `palette_forks`, `projects`, `project_palettes`, `collections`,
  `vault_palettes`, `favorite_colors`, `user_workspace_state`, `cms_articles`,
  `community_submissions`, `taxonomy_tags`, `curated_images`, `audit_logs`
  e `ai_settings`. Todas com RLS habilitada.
- **Auth & RBAC** — `auth.users` + `profiles`. O trigger `handle_new_user` cria o
  perfil sempre com `role = 'user'`; `raw_user_meta_data` **nunca** é usado para
  autorização porque é editável pelo cliente. Cargos só mudam via RPC
  `admin_set_profile_role`, restrita a administradores.
- **Storage** — bucket público `avatars` com escrita restrita à pasta
  `<auth.uid()>/` do próprio usuário (INSERT + SELECT + UPDATE + DELETE).
- **Edge Functions** — `ai-generate-article` (geração de artigos; as chaves dos
  provedores ficam em `ai_settings` e nunca chegam ao navegador) e
  `admin-create-user` (única rota com `service_role` para gravar em `auth.users`).

Aplicando as migrations localmente:

```bash
supabase link --project-ref <seu-ref>
supabase db push
```

Para promover o primeiro administrador (não existe rota segura na aplicação,
porque qualquer auto-promoção seria explorável):

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

📂 Project Structure

Plaintext

src/

├── components/     # UI views, modals, and navigation controls[cite: 1]

├── services/       # Supabase client, data-access layer, auth and AI services[cite: 1]

│   ├── supabase.ts           # bootstrap do cliente (env vars)[cite: 1]

│   ├── db.ts                 # única porta de entrada para o Postgres[cite: 1]

│   ├── authService.ts        # Supabase Auth + RBAC[cite: 1]

│   ├── avatarService.ts      # upload de avatar no Storage[cite: 1]

│   └── aiArticleService.ts   # config de IA + invocação da Edge Function[cite: 1]

├── hooks/          # Reusable React hooks[cite: 1]

├── utils/          # Conversão cromática, contraste e formatação de datas[cite: 1]

└── types.ts        # Global TypeScript interfaces and definitions[cite: 1]

supabase/

├── functions/      # Edge Functions (runtime Deno)[cite: 1]

└── migrations/     # Schema, RLS, triggers e seed[cite: 1]

🤝 Contributing

Contributions, mathematical color improvements, and bug fixes are welcome!

## Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'feat: add amazing feature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

# 📄 License
Distributed under the MIT License.
