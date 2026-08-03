        const UPDATE_DATE = "10 Jun 2026";

        const LOCATIONS = [
            { flag:"🇺🇸", country:"USA", city:"Little Rock", ip:"xxx.xx.xx.xxx",
              protocol:"Automatic" },
            { flag:"🇯🇵", country:"Japan", city:"Yokohama", ip:"xxx.xx.xx.xxx",
              protocol:"Lightway - UDP", encryption:"ChaCha20", natHeartbeats:true },
            { flag:"🇯🇵", country:"Japan", city:"Tokyo", ip:"xxx.xx.xx.xxx",
              protocol:"IKEv2" },
            { flag:"🇺🇸", country:"USA", city:"New York", ip:"xxx.xx.xx.xxx",
              protocol:"Automatic or Wireguard" },
            { flag:"🇳🇵", country:"Nepal", city:"Nepal", ip:"xxx.xx.xx.xxx",
              protocol:"Lightway - TCP", encryption:"ChaCha20", natHeartbeats:true },
            { flag:"🇺🇸", country:"USA", city:"Dallas", ip:"xxx.xx.xx.xxx",
              protocol:"Automatic" }
        ];
        // ============================================================

        const PROTO_DESC = {
            "Automatic":      "ExpressVPN will automatically pick the protocol most appropriate for your network.",
            "Lightway - UDP": "Engineered by ExpressVPN, Lightway is optimized for speed, security, and reliability—and provides post-quantum support.",
            "Lightway - TCP": "May be slower than Lightway - UDP but connects better on certain networks. Also offers post-quantum protection.",
            "WireGuard":      "Should be effective across most network types, but no TCP client.",
            "IKEv2":      "Fast, but may not work on all networks."
        };
        const ENC_LABEL = { "Automatic":"Automatic (recommended)", "AES":"AES", "ChaCha20":"ChaCha20" };
        const ENC_ORDER = ["Automatic","AES","ChaCha20"];

        // /data/express-guide.json က panel ကနေ ပြင်လို့ရတာမို့ template ထဲ
        // ထည့်တဲ့ တန်ဖိုးတိုင်းကို escape လုပ်တယ် (panel/PAT ပေါက်သွားရင်လည်း
        // guide page ထဲ markup မထိုးနိုင်စေရ)။ PROTO_DESC / ENC_LABEL က
        // constant ဖြစ်လို့ ဘေးကင်းသည်။
        function esc(s){
            return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
                return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
            });
        }

        function step1(loc){
            const proto = String(loc.protocol || "");
            const isLW = proto.indexOf("Lightway") === 0;
            let encBox = "";
            if(isLW){
                const selEnc = loc.encryption || "Automatic";
                const rows = ENC_ORDER.map(e=>{
                    const on = (e===selEnc);
                    return `<div class="enc-row"><span class="radio ${on?'on':''}"></span><span class="ename ${on?'on':''}">${ENC_LABEL[e]}</span></div>`;
                }).join("");
                const natOn = loc.natHeartbeats;
                encBox = `
                <div class="enc-box">
                    <p class="etitle">Select Lightway encryption:</p>
                    ${rows}
                    <div class="nat-row">
                        <div>
                            <div class="ntitle">Lightway NAT heartbeats</div>
                            <div class="ndesc">Enabling this setting will help some apps and email clients fetch notifications faster. This will increase battery consumption.</div>
                        </div>
                        <div class="toggle ${natOn?'on':'off'}"><span class="knob"></span></div>
                    </div>
                </div>`;
            }
            return `
            <div class="lg-card">
                <span class="lg-badge badge-green">STEP 1: Protocol ချိန်းပါ</span>
                <div class="proto-inner">
                    <p class="proto-label">Select Protocol:</p>
                    <div class="proto-sel">
                        <span class="radio on"></span>
                        <div>
                            <span class="pname">${esc(proto)}</span>
                            <span class="pdesc">${Object.prototype.hasOwnProperty.call(PROTO_DESC, proto) ? PROTO_DESC[proto] : ""}</span>
                        </div>
                    </div>
                    ${encBox}
                </div>
            </div>`;
        }

        function step2(loc){
            return `
            <div class="lg-card" style="background:transparent;border-color:rgba(0,210,255,0.25);">
                <span class="lg-badge badge-cyan">STEP 2: ${esc(loc.city || "")} Location ချိတ်ပါ</span>
                <div class="conn">
                    <div class="conn-top">
                        <i class="fa-solid fa-power-off power"></i>
                        <span class="pstat"><i class="fa-solid fa-lock"></i> Protected</span>
                    </div>
                    <div class="conn-body">
                        <div class="conn-block loc-row">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <span class="flag">${esc(loc.flag || "")}</span>
                                <div>
                                    <div class="llabel">Selected Location</div>
                                    <div class="lname">${esc(loc.country || "")} - ${esc(loc.city || "")}</div>
                                </div>
                            </div>
                            <span class="change">Change <i class="fa-solid fa-location-dot"></i></span>
                        </div>
                        <div class="conn-block">
                            <div class="ip-row">
                                <span class="iplab">VPN IP Address:</span>
                                <span class="ipval">${esc(loc.ip || "")} <i class="fa-solid fa-rotate" style="font-size:.6rem;"></i></span>
                            </div>
                            <div class="map">
                                <i class="fa-solid fa-map-location-dot"></i>
                                <span class="dot"></span><span class="dot-core"></span>
                            </div>
                        </div>
                        <div class="grid2">
                            <div class="mini">
                                <div class="mlab">Time Protected</div>
                                <div class="mval">&lt;1h <span style="font-weight:400;color:var(--txt-dim2);font-size:.6rem;">this week</span></div>
                            </div>
                            <div class="mini proto">
                                <div class="mlab">Protocol (ရွေးချယ်မှု)</div>
                                <div class="mval">${esc(loc.protocol || "")}</div>
                            </div>
                        </div>
                        <div class="sda">
                            <span><i class="fa-solid fa-shield-halved" style="color:var(--green);"></i> Secure Device Assistant</span>
                            <span class="sval">3 out of 4</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        function renderSet(loc){
            return `<div class="lg-set">${step1(loc)}<div class="lg-arrow"><i class="fa-solid fa-arrow-right"></i></div>${step2(loc)}</div>`;
        }

        function renderAll(updated, locations){
            // protocol မပါတဲ့ location က step1 မှာ ကျမယ် — အဲ့ဒါတွေ ကျော်ပြီး
            // ကျန်တာ တစ်ခုမှ မရှိရင် မ render ဘဲ static fallback ကို ထားခဲ့သည်
            const list = (locations || []).filter(function(loc){ return loc && loc.protocol; });
            if(!list.length) return;
            document.getElementById("locationWrap").innerHTML = list.map(renderSet).join("");
            document.getElementById("updateDate").textContent = updated;
        }

        // static fallback first (page never blank), then the panel-managed data
        renderAll(UPDATE_DATE, LOCATIONS);
        fetch('/data/express-guide.json')
            .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
            .then(function(d){
                if (d && Array.isArray(d.locations) && d.locations.length)
                    renderAll(d.updated || UPDATE_DATE, d.locations);
            })
            .catch(function(){ /* fallback render stays */ });
