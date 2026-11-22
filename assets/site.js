(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  // Fix all exported page navigation and add mobile navigation affordance.
  const header = $('header');
  if (header) {
    const nav = $('header nav');
    const actions = header.querySelector('.flex.items-center.gap-3, .flex.items-center.gap-space-sm, .flex.items-center.gap-space-md');
    if (nav && !$('.mobile-menu-toggle', header)) {
      const toggle = document.createElement('button');
      toggle.className = 'mobile-menu-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-label', 'باز کردن فهرست');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span class="material-symbols-outlined">menu</span>';
      (actions || header.firstElementChild || header).appendChild(toggle);
      const mobile = nav.cloneNode(true);
      mobile.className = 'mobile-nav';
      mobile.removeAttribute('data-active-classes');
      mobile.querySelectorAll('a[data-path]').forEach(a => {
        const p = a.getAttribute('data-path');
        a.href = ({home:'index.html',about:'about.html',contact:'contact.html'})[p] || a.href;
      });
      header.appendChild(mobile);
      toggle.addEventListener('click', () => {
        const open = mobile.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.innerHTML = `<span class="material-symbols-outlined">${open?'close':'menu'}</span>`;
      });
      mobile.addEventListener('click', e => {
        if (e.target.closest('a')) {
          mobile.classList.remove('is-open');
          toggle.setAttribute('aria-expanded','false');
          toggle.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        }
      });
    }
  }

  // Keep navigation paths valid on every screen.
  $$('a[data-path]').forEach(a => {
    const p = a.getAttribute('data-path');
    if (p) a.href = ({home:'index.html',about:'about.html',contact:'contact.html'})[p] || a.href;
  });

  // Search control: lightweight on-page search, no backend required.
  $$('button[aria-label="جستجو"],button[aria-label="Search"]').forEach(btn => {
    btn.addEventListener('click', () => {
      let box = $('#siteSearch');
      if (!box) {
        box = document.createElement('form');
        box.id = 'siteSearch';
        box.style.cssText = 'position:fixed;z-index:999;top:86px;left:50%;transform:translateX(-50%);width:min(92vw,520px);padding:14px;background:#14161f;border:1px solid #f5b30166;border-radius:16px;box-shadow:0 18px 50px #000b;display:flex;gap:8px';
        box.innerHTML = '<input aria-label="عبارت جستجو" placeholder="جستجو در همین صفحه..." style="flex:1;min-width:0;background:#08080a;border:1px solid #ffffff22;border-radius:10px;padding:10px;color:#fff;font:inherit"><button type="submit" style="background:#f5b301;color:#271900;border:0;border-radius:10px;padding:0 14px;font:inherit">بگرد</button><button type="button" aria-label="بستن" style="background:transparent;color:#ffd485;border:0;font-size:20px">×</button>';
        document.body.appendChild(box);
        box.addEventListener('submit', e => {
          e.preventDefault();
          const q = box.querySelector('input').value.trim();
          if (!q) return;
          const found = [...document.querySelectorAll('main h1,main h2,main h3,main p,main a')].find(el => el.textContent.toLowerCase().includes(q.toLowerCase()));
          if (found) { found.scrollIntoView({behavior:'smooth',block:'center'}); found.style.outline='1px solid #f5b301'; setTimeout(()=>found.style.outline='',1800); }
          else showToast('موردی در این صفحه پیدا نشد');
        });
        box.querySelector('[aria-label="بستن"]').addEventListener('click',()=>box.remove());
      } else box.remove();
    });
  });

  // Accessible FAQ accordions.
  $$('.faq-item').forEach(item => {
    const button = $('.faq-toggle', item), content = $('.faq-content', item);
    if (!button || !content) return;
    button.setAttribute('aria-expanded','false');
    button.addEventListener('click', () => {
      const open = content.style.maxHeight && content.style.maxHeight !== '0px';
      $$('.faq-item').forEach(other => {
        const c = $('.faq-content',other), b = $('.faq-toggle',other), icon = $('.faq-icon',other);
        if(c) c.style.maxHeight='0px';
        if(b) b.setAttribute('aria-expanded','false');
        if(icon) icon.classList.remove('rotate-180');
      });
      if(!open){content.style.maxHeight=content.scrollHeight+'px';button.setAttribute('aria-expanded','true');$('.faq-icon',item)?.classList.add('rotate-180');}
    });
  });

  // Scroll reveal for substantial content blocks.
  const candidates = $$('main section, main article, main .gold-border-glow');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.08});
    candidates.forEach((el,i)=>{el.setAttribute('data-reveal',''); if(i<2)el.classList.add('is-visible'); else observer.observe(el);});
  }

  function showToast(message){
    let toast=$('.toast-note');
    if(!toast){toast=document.createElement('div');toast.className='toast-note';document.body.appendChild(toast);}
    toast.textContent=message;toast.classList.add('show');
    clearTimeout(toast._timer);toast._timer=setTimeout(()=>toast.classList.remove('show'),2200);
  }

  // Clipboard helper for the contact screen.
  const copyBtn = $('#copyHandleBtn');
  if(copyBtn){
    copyBtn.addEventListener('click', async()=>{
      try{await navigator.clipboard.writeText('@trades4forexbot');showToast('شناسه تلگرام کپی شد');}
      catch(e){const temp=document.createElement('textarea');temp.value='@trades4forexbot';document.body.appendChild(temp);temp.select();document.execCommand('copy');temp.remove();showToast('شناسه تلگرام کپی شد');}
    });
  }

  // Existing form forwards validated messages to Telegram.
  const form=$('#contactForm');
  if(form){
    const name=$('#userName'), contact=$('#userContact'), message=$('#userMessage');
    const success=$('#formSuccessState'), forward=$('#forwardTelegramLink');
    form.addEventListener('submit',e=>{
      e.preventDefault();
      let valid=true;
      [['nameError',name],['contactError',contact],['messageError',message]].forEach(([id,input])=>{
        const error=$('#'+id);
        const bad=!input?.value.trim();
        if(error) error.classList.toggle('hidden',!bad);
        if(bad) valid=false;
      });
      if(!valid)return;
      const text=`سلام، من ${name.value.trim()} هستم.\nراه ارتباطی: ${contact.value.trim()}\nپیام:\n${message.value.trim()}`;
      const url='https://t.me/trades4forexbot?text='+encodeURIComponent(text);
      if(forward) forward.href=url;
      if(success){success.classList.remove('hidden');success.scrollIntoView({behavior:'smooth',block:'nearest'});}
      else window.open(url,'_blank','noopener');
    });
  }

  // Home page carousel controls: operate on adjacent slide groups if present.
  const slideTrack = $('[data-carousel-track]');
  if(slideTrack){
    let index=0; const slides=$$('[data-carousel-slide]',slideTrack);
    const render=()=>slides.forEach((s,i)=>s.style.display=(i===index?'':'none'));
    $$('[data-carousel-next]').forEach(b=>b.addEventListener('click',()=>{index=(index+1)%slides.length;render();}));
    $$('[data-carousel-prev]').forEach(b=>b.addEventListener('click',()=>{index=(index-1+slides.length)%slides.length;render();}));
    if(slides.length)render();
  }
})();
