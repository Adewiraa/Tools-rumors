export const PORTAL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#151A1D"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#F6F5F1" stroke-width="34"/>
  <path d="M256 102v308M102 256h308" stroke="#F6F5F1" stroke-width="34" stroke-linecap="round"/>
  <path d="M164 156c52 31 132 31 184 0M164 356c52-31 132-31 184 0M156 164c31 52 31 132 0 184M356 164c-31 52-31 132 0 184" stroke="#A98C64" stroke-width="24" stroke-linecap="round" fill="none"/>
</svg>`;

export const createPortalIconResponse = () => new Response(PORTAL_ICON_SVG, {
  headers: {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
  },
});
