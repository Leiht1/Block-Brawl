// Shared obstacle assets; each map facility has its own authored builder.
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../dist/assets/maps/',import.meta.url));await fs.mkdir(out,{recursive:true});
const svg=(size,body)=>"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\""+size+"\" height=\""+size+"\" viewBox=\"0 0 "+size+" "+size+"\">"+body+"</svg>";
const rock=`<defs><linearGradient id="rock" x2=".6" y2="1"><stop stop-color="#d7b793"/><stop offset=".4" stop-color="#ad8a67"/><stop offset="1" stop-color="#574238"/></linearGradient></defs><ellipse cx="64" cy="109" rx="49" ry="11" fill="#241a15" opacity=".5"/><path d="M17 41L42 15L87 14L113 45L105 97L77 113L30 105L11 78Z" fill="#4a352b"/><path d="M17 35L42 10L87 10L113 39L105 90L77 107L30 99L11 71Z" fill="url(#rock)" stroke="#48332a" stroke-width="3"/><path d="M42 10L49 39L91 30L87 10Z" fill="#e5c7a3" opacity=".55"/><path d="M17 35L49 39L33 74L11 71Z" fill="#c29e76"/><path d="M49 39L67 55L58 76L70 103M91 30L82 54L97 71" fill="none" stroke="#5e4636" stroke-width="4"/><path d="M35 28L44 20L74 20" fill="none" stroke="#f2dac0" stroke-width="4" stroke-linecap="round"/>`;
await fs.writeFile(out+'falling-rock.svg',svg(128,rock));
await fs.writeFile(out+'crystal-obstacle.svg',svg(128,`<path d="M24 28L64 8L104 28L117 79L64 117L11 79Z" fill="#8bcfe7" stroke="#eaffff" stroke-width="4"/><path d="M64 8L46 52L11 79L64 117L86 56L104 28L46 52Z" fill="#cff8ff" opacity=".55"/>`));
await import('./build-cliff-art.mjs');
await import('./build-facility-art.mjs');
