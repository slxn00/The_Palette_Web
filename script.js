/* =========================================================
   [사진 업로드 설정] Supabase 무료 저장소
   - url, key를 비워 두면 업로드(+) 버튼이 나타나지 않습니다.
   - key에는 Publishable key(또는 anon public key)를 넣으세요. service_role(secret) 키는 절대 넣지 마세요.
   ========================================================= */
window.PALETTE_UPLOAD={
  url:'https://swsusvbilqprfpkzjbzd.supabase.co/rest/v1/',            // 예: 'https://abcdefgh.supabase.co'
  key:'sb_publishable_X204yDUMFNr7etz7rqxw8Q_WTgQpgH4',            // 예: 'sb_publishable_...' 또는 'eyJhbGciOi...'
  bucket:'palette'   // Supabase에서 만든 버킷 이름
};

(function(){
  var ph="data:image/svg+xml,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='#e4e4df'/></svg>");
  document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&!t.dataset.fb){t.dataset.fb='1';if(t.closest('.mosaic')||t.closest('.face')){t.style.display='none'}else{t.src=ph}}},true);
})();

if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.querySelectorAll('.track').forEach(function(t){
    Array.prototype.slice.call(t.children).forEach(function(c){
      var n=c.cloneNode(true);n.setAttribute('aria-hidden','true');t.appendChild(n);
    });
  });
}

(function(){
  var s=document.getElementById('stage');if(!s)return;
  var imgs=[].slice.call(s.querySelectorAll('img')),dots=s.querySelector('.dots'),i=0,t,
      reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!imgs.length)return;
  function go(k){i=k;imgs.forEach(function(m,j){m.classList.toggle('on',j===i)});[].forEach.call(dots.children,function(b,j){b.setAttribute('aria-current',j===i)})}
  function stop(){clearInterval(t)}
  function start(){stop();if(!reduce)t=setInterval(function(){if(!document.hidden)go((i+1)%imgs.length)},3000)}
  imgs.forEach(function(_,k){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','사진 '+(k+1));b.onclick=function(){go(k);start()};dots.appendChild(b)});
  s.addEventListener('mouseenter',stop);s.addEventListener('mouseleave',start);s.addEventListener('focusin',stop);s.addEventListener('focusout',start);
  go(0);start();
})();

// 월별 사진 크게 보기(모달) + 같은 달 사진 넘기기 + 마지막 사진에서 '+'로 업로드
(function(){
  var d=document.getElementById('lightbox');if(!d||!d.showModal)return;
  if(window.PALETTE_UPLOAD)window.PALETTE_UPLOAD.key=String(window.PALETTE_UPLOAD.key||'').trim();
  var img=d.querySelector('.lb-stage img'),count=d.querySelector('.lb-count'),
      prev=d.querySelector('.lb-prev'),next=d.querySelector('.lb-next'),
      reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,
      cfg=window.PALETTE_UPLOAD||{},base=baseUrl(cfg.url),canUpload=!!(base&&cfg.key),
      list=[],idx=0,alt0='',label='',monthKey='',last,closing,token=0,busy=false,msgTimer;

  // url에 무엇을 붙여 넣어도 'https://프로젝트.supabase.co' 만 남김
  //  예) https://abcd.supabase.co/rest/v1/  →  https://abcd.supabase.co
  //      https://supabase.com/dashboard/project/abcd/...  →  https://abcd.supabase.co
  function baseUrl(u){
    u=String(u||'').trim();if(!u)return '';
    var m=u.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);if(m)return 'https://'+m[1]+'.supabase.co';
    if(!/^https?:\/\//i.test(u))u='https://'+u;
    try{return new URL(u).origin}catch(e){return ''}
  }
  // 파일 선택 창(숨김)
  var picker=document.createElement('input');
  picker.type='file';picker.accept='image/*';picker.multiple=true;picker.hidden=true;d.appendChild(picker);

  function setCount(){if(!busy)count.textContent=list.length>1?(idx+1)+' / '+list.length:''}
  function msg(t,keep){clearTimeout(msgTimer);count.textContent=t;if(!keep)msgTimer=setTimeout(function(){busy=false;setCount()},2500)}
  function preload(k){if(k>=0&&k<list.length)new Image().src=list[k]}
  // 버튼 상태: 첫 사진이면 ‹ 숨김, 마지막 사진이면 › 대신 +
  function setNav(){
    var atEnd=idx>=list.length-1;
    prev.hidden=idx<=0;
    next.hidden=atEnd&&!canUpload;
    next.classList.toggle('is-add',atEnd);
    next.textContent=atEnd?'+':'›';
    next.setAttribute('aria-label',atEnd?'사진 올리기':'다음 사진');
    next.disabled=busy;
    d.classList.toggle('single',prev.hidden&&next.hidden);
  }

  // dir: 1 = 다음(왼쪽으로 밀려남), -1 = 이전
  function show(k,dir){
    if(k<0||k>=list.length)return;
    idx=k;var src=list[idx],my=++token;
    img.alt=label+' 사진 '+(idx+1)+(idx===0&&alt0?' – '+alt0:'');
    setCount();setNav();preload(idx+1);preload(idx-1);
    if(!dir||reduce){img.src=src;return}
    img.style.transition='transform .2s ease,opacity .2s ease';
    img.style.transform='translateX('+(-dir*60)+'px)';img.style.opacity=0;
    var pre=new Image(),ready=false,waited=false;
    function enter(){
      if(my!==token||!ready||!waited)return;
      img.style.transition='none';img.style.transform='translateX('+(dir*60)+'px)';
      img.src=src;void img.offsetWidth;
      img.style.transition='transform .32s cubic-bezier(.2,.8,.2,1),opacity .32s ease';
      img.style.transform='';img.style.opacity=1;
    }
    pre.onload=pre.onerror=function(){ready=true;enter()};pre.src=src;
    setTimeout(function(){waited=true;enter()},200);
  }
  function step(dir){show(idx+dir,dir)}

  // ---- Supabase 저장소 ----
  function api(path,opt){
    opt=opt||{};
    // 새 키(sb_publishable_...)는 JWT가 아니라 apikey 헤더에만 넣어야 함. 예전 anon 키(eyJ...)일 때만 Authorization도 보냄
    var h={apikey:cfg.key};if(/^eyJ/.test(cfg.key))h.Authorization='Bearer '+cfg.key;
    opt.headers=Object.assign(h,opt.headers||{});
    return fetch(base+'/storage/v1/'+path,opt).then(function(r){
      if(r.ok)return r;
      return r.text().then(function(t){var m=t;try{var j=JSON.parse(t);m=j.message||j.error||t}catch(e){}throw new Error(r.status+' '+m)});
    });
  }
  function publicUrl(path){return base+'/storage/v1/object/public/'+cfg.bucket+'/'+path}
  function loadRemote(key){
    return api('object/list/'+cfg.bucket,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({prefix:key,limit:1000,offset:0,sortBy:{column:'created_at',order:'asc'}})})
      .then(function(r){return r.json()})
      .then(function(a){return a.filter(function(f){return f.id&&f.name&&f.name.charAt(0)!=='.'}).map(function(f){return publicUrl(key+'/'+f.name)})});
  }
  // 큰 사진은 긴 쪽 2000px JPG로 줄여서 올림
  function shrink(file){
    return new Promise(function(res,rej){
      var u=URL.createObjectURL(file),im=new Image();
      im.onload=function(){
        var max=2000,w=im.naturalWidth,h=im.naturalHeight,r=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');
        c.width=Math.round(w*r);c.height=Math.round(h*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        URL.revokeObjectURL(u);c.toBlob(function(b){b?res(b):rej(new Error('변환 실패'))},'image/jpeg',.85);
      };
      im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('이미지를 읽을 수 없음'))};
      im.src=u;
    });
  }
  function upload(files){
    files=[].filter.call(files,function(f){return /^image\//.test(f.type)});
    if(!files.length||busy)return;
    var key=monthKey,my=token,done=0,added=[];busy=true;setNav();
    var chain=Promise.resolve();
    files.forEach(function(f,i){
      chain=chain.then(function(){
        msg('올리는 중… '+(i+1)+' / '+files.length,true);
        return shrink(f).then(function(blob){
          var path=key+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.jpg';
          return api('object/'+cfg.bucket+'/'+path,{method:'POST',headers:{'Content-Type':'image/jpeg','x-upsert':'false'},body:blob})
            .then(function(){done++;added.push(publicUrl(path))});
        });
      });
    });
    var err='';
    chain.catch(function(e){err=e&&e.message||String(e);console.error('업로드 실패',e)}).then(function(){
      busy=false;
      if(my===token&&d.open&&key===monthKey&&added.length){
        list=list.concat(added);show(list.length-added.length,1);
      }
      busy=true;
      if(done===files.length)msg('사진을 올렸어요');
      else{msg('올리지 못했어요 ('+done+' / '+files.length+') · '+err,true);setTimeout(function(){busy=false;setCount();setNav()},8000)}
      setNav();
    });
  }
  picker.addEventListener('change',function(){upload(picker.files);picker.value=''});

  function open(btn){
    var small=btn.querySelector('img'),cell=btn.parentNode,mo=cell.querySelector('.mo');
    list=(btn.dataset.photos||'').split(',').map(function(x){return x.trim()}).filter(Boolean);
    if(!list.length)return;
    last=btn;closing=false;token++;busy=false;clearTimeout(msgTimer);
    monthKey=(cell.className.match(/\bm(\d+)\b/)||[])[0]||'etc';
    label=mo?mo.textContent:'';alt0=small.alt;
    img.style.transition='none';img.style.transform='';img.style.opacity=1;
    idx=0;setCount();setNav();img.alt=alt0;
    img.src=small.currentSrc||small.src;  // 작은 사진을 먼저 보여 주고
    var my=token,big=new Image();big.onload=function(){if(my===token)img.src=big.src};big.src=list[0];  // 큰 사진이 준비되면 교체
    preload(1);
    // 방문자들이 올린 사진을 이어 붙임
    if(canUpload){
      var base=list.slice();
      loadRemote(monthKey).then(function(r){
        if(my!==token||!r.length)return;
        list=base.concat(r.filter(function(u){return base.indexOf(u)<0}));setCount();setNav();preload(idx+1);
      }).catch(function(e){console.error('사진 목록을 불러오지 못했어요',e);if(my===token){busy=true;msg('사진 목록 오류 · '+e.message)}});
    }
    document.documentElement.classList.add('lb-lock');
    d.showModal();
    requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('show')})});
  }
  function close(){
    if(closing||!d.open)return;closing=true;token++;
    d.classList.remove('show');
    var done=function(){if(!closing)return;closing=false;d.close();document.documentElement.classList.remove('lb-lock');if(last)last.focus()};
    if(reduce)done();else setTimeout(done,350);
  }

  document.querySelectorAll('.mosaic .zoom').forEach(function(b){b.addEventListener('click',function(){open(b)})});
  d.querySelector('.lb-close').addEventListener('click',close);
  prev.addEventListener('click',function(){step(-1)});
  next.addEventListener('click',function(){
    if(idx>=list.length-1){if(canUpload&&!busy)picker.click()}else step(1);
  });
  d.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}else if(e.key==='ArrowRight'){e.preventDefault();step(1)}});
  d.addEventListener('cancel',function(e){e.preventDefault();close()});

  // 바깥(어두운 부분) 클릭 시 닫기 — 스와이프 직후의 클릭은 무시
  var sx=null,sy=0,swiped=false;
  d.addEventListener('click',function(e){
    if(swiped){swiped=false;return}
    var t=e.target;if(t===d||t.tagName==='FIGURE'||t.classList.contains('lb-stage'))close();
  });
  // 손가락/마우스로 옆으로 밀어서 넘기기
  var stage=d.querySelector('.lb-stage');
  stage.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;swiped=false});
  stage.addEventListener('pointerup',function(e){
    if(sx===null)return;var dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){swiped=true;step(dx<0?1:-1)}
  });
  stage.addEventListener('pointercancel',function(){sx=null});
})();

// 스크립트가 늦게 실행돼 이미 실패한 이미지도 대체 처리
document.querySelectorAll('img').forEach(function(t){
  if(t.complete&&t.naturalWidth===0){t.dispatchEvent(new Event('error'))}
});