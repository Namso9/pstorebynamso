import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Premium Store",
  description:
    "Premium Store ၏ ဝယ်ယူမှုစည်းမျဉ်းများ — refund, warranty နှင့် account အသုံးပြုမှုဆိုင်ရာ သတ်မှတ်ချက်များ။",
  alternates: { canonical: "/terms-of-service/" },
  openGraph: {
    type: "article",
    url: "/terms-of-service/",
    title: "Terms of Service | Premium Store",
    description:
      "Premium Store ၏ ဝယ်ယူမှုစည်းမျဉ်းများ — refund, warranty နှင့် account အသုံးပြုမှုဆိုင်ရာ သတ်မှတ်ချက်များ။",
    images: ["/images/p1.webp"],
  },
};

export default function StoreTermsPage() {
  return (
    <article className="content-page terms-document">
      <header className="terms-header">
        <p className="eyebrow">Store policy</p>
        <h1>Terms of Service</h1>
        <p>နောက်ဆုံးပြင်ဆင်သည့်ရက်စွဲ - ဇန်နဝါရီ ၁၇၊ ၂၀၂၆</p>
      </header>

      <section>
        <h2>၁။ ဝယ်ယူခြင်းနှင့် ပစ္စည်းရွေးချယ်မှု</h2>
        <p>
          လိုချင်တဲ့ Digital Product ကို အပေါ်ဆုံးက သက်ဆိုင်ရာ List ထဲမှာ
          ရှာဖွေကြည့်ရှုနိုင်ပါတယ်။
        </p>

        <h2>၂။ ငွေပေးချေမှုဆိုင်ရာ သတ်မှတ်ချက်များ</h2>
        <p>
          ဝယ်ယူလိုသော ပစ္စည်းများအတွက် Payment နည်းလမ်းများကို Navigation ထဲက
          Payment Methods ထဲတွင် ဝင်ရောက်ကြည့်ရှုနိုင်ပါတယ်။ ငွေလွှဲပြီးပါက
          သက်ဆိုင်ရာ Amount ကို Screenshot ရိုက်ထားရန် လိုအပ်ပါသည်။ Admin reply
          စောင့်စရာမလိုဘဲ Telegram Bot ထဲတွင် Top Up ဖြည့်ပြီး ဝယ်ယူနိုင်ပါသည်။
        </p>

        <h2>၃။ Screenshot ပေးပို့ခြင်းနှင့် အတည်ပြုခြင်း</h2>
        <p>
          ငွေလွှဲ Screenshot (SS) ကို Messenger သို့မဟုတ် Telegram တို့မှတစ်ဆင့်
          ပေးပို့နိုင်ပါတယ်။ Canva, Chat Gpt, Zoom ဒီသုံးခုအတွက်က မိမိ၏ Email
          Address ကိုပါ တစ်ပါတည်း ပေးပို့ပေးရန် လိုအပ်ပါသည်။ Office 365 pro plus
          နဲ့ Netflix အတွက်ဆိုပါက မိမိထားချင်တဲ့ Pf name ပို့ပေးရန်လိုအပ်ပါသည်။
          Spotify မိမိအကောင့်နဲ့တိုးချင်ပါက Spotify mail and pw ပေးပို့ရန်လိုပါသည်။
          ကျန် subscriptions များအတွက်က ဒီဘက်က mail pw ပို့ပေးမည်ဖြစ်ပါသည်။ Cus
          ဘက်ကပေးစရာမလိုပါ။
        </p>

        <div className="terms-highlight">
          <h2>Telegram Bot ဖြင့် ဝယ်ယူခြင်း</h2>
          <p>
            Telegram Bot မှတစ်ဆင့် Wallet Top Up ပြုလုပ်သောအခါ ငွေလွှဲ Screenshot
            ကို Admin စစ်ဆေးပြီးမှ Wallet Balance ထဲသို့ ထည့်ပေးပါမည်။ Wallet
            Balance ဖြင့် ဝယ်ယူသော Auto Delivery Product များသည် Stock ရှိပါက
            Bot မှတစ်ဆင့် အလိုအလျောက်ပေးပို့ပေးပါမည်။ Manual Delivery လိုအပ်သော
            Product များအတွက် Admin မှ ဆက်သွယ်ပေးမည်ဖြစ်ပါသည်။
          </p>
          <a
            className="button button--primary button--md"
            href="https://t.me/PSNamso_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Telegram Bot
          </a>
        </div>

        <h2>၄။ ဝန်ဆောင်မှုပေးအပ်ခြင်း</h2>
        <p>
          ပုံမှန်အားဖြင့် ၁၅ မိနစ်မှ ၃၀ မိနစ်အတွင်း သင်မှာယူထားသော Account ကို
          သင့်ထံသို့ ပေးပို့ပေးမည် ဖြစ်ပါသည်။
        </p>

        <h2>၅။ ပြဿနာများအား မေးမြန်းခြင်း</h2>
        <p>
          လုပ်ဆောင်စဉ်အတွင်း အခက်အခဲရှိပါက သို့မဟုတ် မသိရှိသည်များ ရှိပါက
          သက်ဆိုင်ရာ Chatbox (Messenger, Telegram) များမှတစ်ဆင့် အချိန်မရွေး
          ဆက်သွယ်မေးမြန်းနိုင်ပါသည်။
        </p>

        <h2>၆။ ကိုယ်ရေးအချက်အလက် ထိန်းသိမ်းမှု (Privacy)</h2>
        <p>
          သင်ပေးပို့ထားသော Email Address နှင့် ငွေလွှဲ Screenshot အချက်အလက်များကို
          Account ပေးပို့ရန်အတွက်သာ အသုံးပြုမည်ဖြစ်ပြီး၊ အခြား
          မည်သည့်နေရာတွင်မျှ မျှဝေခြင်း ပြုလုပ်မည်မဟုတ်ပါ။
        </p>
      </section>

      <aside className="terms-disclaimer">
        <h2>Disclaimer</h2>
        <p>
          If there is any error, we will help our best to solve. But please keep
          in mind that we&apos;re not responsible for anything apart from Account
          Issues.
        </p>
      </aside>
    </article>
  );
}
