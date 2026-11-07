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
  // One open book behind the copy, not a grid of cards: every summary runs on as a page, and the read-aloud
  // highlight moves through it word by word.
  var words = [];
  C.forEach(function (c) {
    var b = document.createElement('b'), sm = document.createElement('small'), p = document.createElement('p');
    b.textContent = c[0]; sm.textContent = c[1];
    c[2].split(' ').forEach(function (w) { var s = document.createElement('span'); s.textContent = w; p.append(s, ' '); words.push(s); });
    wall.append(b, sm, p);
  });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var j = 0;
  setInterval(function () {
    words[j].classList.remove('on');
    j = (j + 1) % words.length;
    words[j].classList.add('on');
  }, 300);
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
