const RECEIPT_ITEMS = [
  { name:'Cold Coffee', qty:1, price:180 },
  { name:'Veg Sandwich', qty:1, price:150 },
  { name:'Fries', qty:1, price:120 },
  { name:'Brownie', qty:1, price:90 },
];
const SUBTOTAL = 540;
const TAX = 27;
const DELIVERY = 30;
const TOTAL = 597;
const MEMBERS = [
  'Nakul',
  'Aradhye',
  'Aarohi',
  'Mahitha'
];
const MEMBER_COLOR = {
  Nakul:'#4C5FD5',
  Aradhye:'#22C99A',
  Aarohi:'#F0A93D',
  Mahitha:'#FF5A5F'
};
const assignment = {
  'Cold Coffee':['You','Priyanshi','Rahul','Ananya'],
  'Veg Sandwich':['You','Rahul'],
  'Fries':['Rahul','Ananya'],
  'Brownie':['Priyanshi']
};
const navButtons = document.querySelectorAll('#tabs button');
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    goTo(btn.dataset.page);
  });
});
function goTo(pageId){
  document
    .querySelectorAll('.page')
    .forEach(p => p.classList.remove('active'));
  document
    .getElementById(pageId)
    .classList.add('active');
  navButtons.forEach(b => {
    b.classList.toggle(
      'active',
      b.dataset.page === pageId
    );
  });
  window.scrollTo({
    top:0,
    behavior:'smooth'
  });
  if(pageId === 'dna'){
    drawDNAChart();
  }
}
let pipelineRunning = false;
function resetPipeline(){
  document
    .querySelectorAll('#pipeline .p-node')
    .forEach(n => {
      n.classList.remove(
        'active',
        'done'
      );
    });
  document
    .getElementById('scanResult')
    .style.display = 'none';
}
function runPipeline(){
  if(pipelineRunning){
    return;
  }
  pipelineRunning = true;
  resetPipeline();
  const nodes =
    document.querySelectorAll('#pipeline .p-node');
  let step = 0;
  function nextStep(){
    if(step > 0){
      nodes[step - 1]
        .classList
        .replace('active','done');
    }
    if(step < nodes.length){
      nodes[step]
        .classList
        .add('active');
      step++;
      setTimeout(
        nextStep,
        450
      );
    }else{
      pipelineRunning = false;
      showScanResult();
    }
  }
  nextStep();
}
function showScanResult(){
  document.getElementById('itemsBody').innerHTML =
    RECEIPT_ITEMS.map(item => `
      <tr>
        <td>
          <input value="${item.name}">
        </td>
        <td class="num">
          <input
            value="${item.qty}"
            style="text-align:right;"
          >
        </td>
        <td class="num">
          <input
            value="₹${item.price.toFixed(2)}"
            style="text-align:right;"
          >
        </td>
      </tr>
    `).join('');
  document
    .getElementById('scanResult')
    .style.display = 'block';
}
function renderItemSplit(){
  const list =
    document.getElementById('itemSplitList');
  list.innerHTML =
    RECEIPT_ITEMS.map(item => `
      <div class="item-row">
        <div>
          <div class="name">
            ${item.name}
          </div>
          <div class="price">
            ₹${item.price}
          </div>
        </div>
        <div
          class="chips"
          data-item="${item.name}"
        >
          ${
            MEMBERS.map(m => `
              <button
                class="chip ${
                  assignment[item.name].includes(m)
                    ? 'on'
                    : ''
                }"
                data-member="${m}"
              >
                ${m}
              </button>
            `).join('')
          }
        </div>
      </div>
    `).join('');
  list
    .querySelectorAll('.chip')
    .forEach(chip => {
      chip.addEventListener(
        'click',
        () => {
          const item =
            chip.parentElement.dataset.item;
          const member =
            chip.dataset.member;
          const people =
            assignment[item];
          const i =
            people.indexOf(member);
          i > -1
            ? people.splice(i,1)
            : people.push(member);
          chip.classList.toggle('on');
          computeSettlement();
        }
      );
    });
}
function computeSettlement(){
  const owedSubtotal =
    Object.fromEntries(
      MEMBERS.map(m => [m,0])
    );
  RECEIPT_ITEMS.forEach(item => {
    const people =
      assignment[item.name];
    if(!people.length){
      return;
    }
    const sharePerPerson =
      item.price / people.length;
    people.forEach(p => {
      owedSubtotal[p] +=
        sharePerPerson;
    });
  });
  const extraCharges =
    TAX + DELIVERY;
  const totalOwed =
    Object.fromEntries(
      MEMBERS.map(m => {
        const proportion =
          SUBTOTAL > 0
            ? owedSubtotal[m] / SUBTOTAL
            : 0;
        return [
          m,
          owedSubtotal[m] +
          proportion * extraCharges
        ];
      })
    );
  const balance =
    Object.fromEntries(
      MEMBERS.map(m => [
        m,
        (m === 'You'
          ? TOTAL
          : 0
        ) - totalOwed[m]
      ])
    );
  const creditors = [];
  const debtors = [];
  Object.entries(balance)
    .forEach(([name,amt]) => {
      if(amt > 0.5){
        creditors.push({
          name,
          amt
        });
      }else if(amt < -0.5){
        debtors.push({
          name,
          amt:-amt
        });
      }
    });
  creditors.sort(
    (a,b) => b.amt - a.amt
  );
  debtors.sort(
    (a,b) => b.amt - a.amt
  );
  const transactions = [];
  let i = 0;
  let j = 0;
  while(
    i < debtors.length &&
    j < creditors.length
  ){
    const pay =
      Math.min(
        debtors[i].amt,
        creditors[j].amt
      );
    transactions.push({
      from:debtors[i].name,
      to:creditors[j].name,
      amount:pay
    });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if(debtors[i].amt < 0.5){
      i++;
    }
    if(creditors[j].amt < 0.5){
      j++;
    }
  }
  renderSettlement(transactions);
}
function renderSettlement(transactions){
  const list =
    document.getElementById('settleList');
  if(!transactions.length){
    list.innerHTML = `
      <div class="alert alert-good">
        <div>✅</div>
        <div>
          Everyone is settled up.
        </div>
      </div>
    `;
    return;
  }
  list.innerHTML =
    transactions.map(t => `
      <div class="txn">
        <div
          class="avatar"
          style="
            background:${MEMBER_COLOR[t.from]};
            width:24px;
            height:24px;
            font-size:10px;
          "
        >
          ${t.from.slice(0,2).toUpperCase()}
        </div>
        <span>${t.from}</span>
        <span style="color:var(--mint);">
          pays →
        </span>
        <span>${t.to}</span>
        <span class="amt">
          ₹${t.amount.toFixed(2)}
        </span>
      </div>
    `).join('') +
    `
      <div class="alert alert-good">
        <div>⚡</div>
        <div>
          <b>
            ${transactions.length}
            transaction${transactions.length > 1 ? 's' : ''}
          </b>
          instead of
          ${MEMBERS.length * (MEMBERS.length - 1) / 2}
          pairwise transfers.
        </div>
      </div>
    `;
}
function drawDNAChart(){
  const canvas =
    document.getElementById('dnaChart');
  if(!canvas){
    return;
  }
  const ctx =
    canvas.getContext('2d');
  const slices = [
    {
      value:42,
      color:'#FF5A5F'
    },
    {
      value:23,
      color:'#4C5FD5'
    },
    {
      value:18,
      color:'#F0A93D'
    },
    {
      value:12,
      color:'#22C99A'
    },
    {
      value:5,
      color:'#5C6270'
    }
  ];
  const cx = 110;
  const cy = 110;
  const rOuter = 92;
  const rInner = 56;
  ctx.clearRect(
    0,
    0,
    220,
    220
  );
  let angleStart =
    -Math.PI / 2;
  slices.forEach(slice => {
    const angle =
      (slice.value / 100) *
      Math.PI *
      2;
    ctx.beginPath();
    ctx.moveTo(
      cx,
      cy
    );
    ctx.arc(
      cx,
      cy,
      rOuter,
      angleStart,
      angleStart + angle
    );
    ctx.closePath();
    ctx.fillStyle =
      slice.color;
    ctx.fill();
    angleStart += angle;
  });
  ctx.globalCompositeOperation =
    'destination-out';
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    rInner,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.globalCompositeOperation =
    'source-over';
  ctx.fillStyle =
    '#EDEEF2';
  ctx.font =
    '700 19px Sora, sans-serif';
  ctx.textAlign =
    'center';
  ctx.fillText(
    '₹3,850',
    cx,
    cy - 2
  );
  ctx.font =
    '500 11px Inter, sans-serif';
  ctx.fillStyle =
    '#8B90A0';
  ctx.fillText(
    'this month',
    cx,
    cy + 16
  );
}
function similarityRow(
  label,
  detail,
  pct
){
  const color =
    pct >= 95
      ? '#22C99A'
      : pct >= 80
        ? '#F0A93D'
        : '#FF5A5F';
  return `
    <div style="margin-top:12px;">
      <div
        style="
          display:flex;
          justify-content:space-between;
          font-size:13px;
          margin-bottom:5px;
        "
      >
        <span>
          ${label}
          <span
            style="
              color:var(--muted);
              font-family:var(--mono);
              font-size:11.5px;
            "
          >
            — ${detail}
          </span>
        </span>
        <span
          style="
            font-family:var(--mono);
            font-weight:700;
            color:${color};
          "
        >
          ${pct}%
        </span>
      </div>
      <div
        class="bar-outer"
        style="height:8px;"
      >
        <div
          class="bar-inner"
          style="
            width:${pct}%;
            background:${color};
          "
        ></div>
      </div>
    </div>
  `;
}
function checkDuplicate(isDuplicate){
  const el =
    document.getElementById('dupResult');
  if(!isDuplicate){
    el.innerHTML = `
      <div class="card">
        <div
          class="alert alert-good"
          style="margin-top:0;"
        >
          <div>✅</div>
          <div>
            <b>No duplicate found.</b>
            <small>
              This receipt doesn't match anything
              in your last 90 days of scans.
            </small>
          </div>
        </div>
      </div>
    `;
    return;
  }
  el.innerHTML = `
    <div class="card">
      <div
        class="alert alert-bad"
        style="margin-top:0;"
      >
        <div>⚠️</div>
        <div>
          <b>
            Possible duplicate receipt.
          </b>
          <small>
            A similar receipt was already uploaded
            on 18 Aug at 7:42 PM.
          </small>
        </div>
      </div>
      <h2 style="margin-top:16px;">
        Similarity comparison
      </h2>
      ${similarityRow(
        'Merchant name',
        'Campus Cafe = Campus Cafe',
        100
      )}
      ${similarityRow(
        'Date &amp; time',
        '18 Aug, 7:42 PM vs 7:44 PM',
        96
      )}
      ${similarityRow(
        'Total amount',
        '₹597.00 = ₹597.00',
        100
      )}
      ${similarityRow(
        'Line items',
        '4 / 4 items match',
        100
      )}
      ${similarityRow(
        'Receipt image',
        'Perceptual hash match',
        91
      )}
      <div
        style="
          margin-top:16px;
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        "
      >
        <button
          class="btn btn-primary"
          onclick="alert('Marked as duplicate — expense will not be added twice.')"
        >
          Flag as duplicate
        </button>
        <button
          class="btn btn-ghost"
          onclick="alert('Kept as a separate expense.')"
        >
          It's a different visit — keep both
        </button>
      </div>
    </div>
  `;
}
renderItemSplit();
computeSettlement();
drawDNAChart();