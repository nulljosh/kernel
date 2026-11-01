// Hero wall: the reader's read-aloud highlight running over real chapter summaries. Silent, decoration only.
(function () {
  var wall = document.getElementById('kwall'); if (!wall) return;
  var C = [["The Art of War", "Chapter 1: Know the ground", "War is serious, so you plan before you move. Count what you have, count what the other side has, and look at the weather, the terrain and the mood of your people."],
    ["Hackers and Painters", "Chapter 1: Why Nerds Are Unpopular", "Popularity is a full-time job. Teens judge clothes, walking style and nearly everything else by what other kids think. Nerds serve two masters, popularity and brains, and brains win."],
    ["How AI Thinks", "Introduction", "Toon says AI is the most powerful tool people have built so far. It can boost human intelligence and help solve problems that used to be out of reach, but it also brings real challenges."],
    ["The Art of War", "Chapter 2: Win without a fight", "The best general breaks the enemy's plans, not his army. Cities that fall without a siege cost nothing. A clever peace beats an expensive victory."],
    ["Machine Learning For Dummies", "Chapter 1: Getting the Real Story About AI", "AI is the theory and development of computer systems capable of tasks that normally require human intelligence."],
    ["Statistics For Dummies", "Purpose of the Book", "Builds the skills to sort through, analyze and evaluate the constant stream of statistics you meet every day: charts, graphs, tables and headlines about polls and studies."],
    ["The Art of War", "Chapter 3: Be like water", "Water avoids high ground and runs to the low places. An army should do the same: avoid strength, strike weakness, and change shape to fit what the enemy does."],
    ["Exercise Science For Dummies", "Chapter 3", "Lift heavy enough. Loads of at least sixty percent of your one-rep max cause the stress that drives adaptation."],
    ["Data Science For Dummies", "Chapter 20: Ten Free Tools", "A rundown of ten free or low-cost tools covering the whole data science workflow: scraping, exploration, machine learning, visualization and infographics."]];
  var mq = function (q) { return matchMedia(q).matches; };
  var n = mq('(max-width: 560px)') ? 3 : mq('(max-width: 900px)') ? 6 : 9, still = mq('(prefers-reduced-motion: reduce)');
  for (var i = 0; i < n; i++) (function (i) {
    var el = document.createElement('div'); el.className = 'kc';
    el.innerHTML = '<b></b><small></small><p></p><div class="pb"><i></i></div>';
    wall.appendChild(el);
    var b = el.querySelector('b'), sm = el.querySelector('small'), p = el.querySelector('p'), bar = el.querySelector('.pb i'), k = i;
    function play() {
      var c = C[k % C.length]; k += n;
      b.textContent = c[0]; sm.textContent = c[1]; p.textContent = ''; bar.style.width = '0';
      var words = c[2].split(' ').map(function (w) { var s = document.createElement('span'); s.textContent = w; p.append(s, ' '); return s; });
      if (still) return;
      var j = 0, last;
      (function step() {
        if (last) last.replaceWith(last.firstChild);
        if (j >= words.length) { last = null; return setTimeout(play, 1800); }
        var m = document.createElement('mark'); words[j].replaceWith(m); m.append(words[j]); last = m;
        bar.style.width = (++j / words.length * 100) + '%';
        setTimeout(step, 240 + Math.random() * 120);
      })();
    }
    setTimeout(play, i * 600);
  })(i);
})();
// Hero parallax: the wall drifts at 0.45, the copy lifts at 0.2 and fades. Off under reduced motion.
(function () {
  var bg = document.querySelector('.hero-bg'), copy = document.querySelector('.hero-copy');
  if (!bg || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var t = 0;
  addEventListener('scroll', function () {
    if (t) return;
    t = requestAnimationFrame(function () {
      t = 0; var y = scrollY, h = innerHeight; if (y > h * 1.2) return;
      bg.style.setProperty('--py', (y * .45) + 'px');
      copy.style.transform = 'translate3d(0,' + (y * .2) + 'px,0)'; copy.style.opacity = Math.max(0, 1 - y / (h * .7));
    });
  }, { passive: true });
})();
