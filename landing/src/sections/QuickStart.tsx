import { InstallTabs } from '../ui/InstallTabs';
import { SectionLabel } from '../ui/SectionLabel';
import { useInView } from '../hooks/useInView';

export function QuickStart(): JSX.Element {
  return (
    <section
      id="start"
      className="mx-auto max-w-[1340px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel
        index="04"
        eyebrow="Integration"
        title="A minimum useful integration in three steps"
        body={
          <>
            Server makes an order. Client opens the checkout. Server verifies
            the result. That is the loop. Pick a gateway adapter and slot it
            into these files.
          </>
        }
      />

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
        <Step
          n="01"
          eyebrow="Install"
          body={
            <div className="flex flex-col gap-5">
              <p className="font-mono text-[12px] leading-relaxed text-fg/75">
                Install the core package. Add peer deps only for the
                gateways and frameworks you use.
              </p>
              <InstallTabs packageName="payment-universal" variant="compact" />
              <div className="space-y-2 font-mono text-[11px]">
                <MiniLine label="react adapter" cmd="npm i react" />
                <MiniLine
                  label="cashfree browser"
                  cmd="npm i @cashfreepayments/cashfree-js"
                />
                <MiniLine label="stripe browser" cmd="npm i @stripe/stripe-js" />
              </div>
            </div>
          }
        />

        <Step
          n="02"
          eyebrow="Client"
          body={
            <pre className="overflow-x-auto border border-line bg-code p-5 font-mono text-[11.75px] leading-[1.7]">
              <code>
                <span className="text-[#ff92c0]">&apos;use client&apos;</span>;
                {'\n'}
                <span className="text-[#ff92c0]">import</span>{' '}
                <span className="text-muted">{'{'}</span> useCheckout{' '}
                <span className="text-muted">{'}'}</span>{' '}
                <span className="text-[#ff92c0]">from</span>{' '}
                <span className="text-[#e8e28b]">
                  &apos;payment-universal/react&apos;
                </span>
                ;{'\n'}
                <span className="text-[#ff92c0]">import</span>{' '}
                <span className="text-muted">{'{'}</span>{' '}
                <span className="text-lime">razorpayBrowser</span>{' '}
                <span className="text-muted">{'}'}</span>{' '}
                <span className="text-[#ff92c0]">from</span>{' '}
                <span className="text-[#e8e28b]">
                  &apos;payment-universal/razorpay/browser&apos;
                </span>
                ;{'\n\n'}
                <span className="text-[#ff92c0]">const</span> adapter ={' '}
                <span className="text-lime">razorpayBrowser</span>({'{'}
                {'\n'}
                {'  '}keyId<span className="text-muted">:</span> env
                <span className="text-muted">.</span>
                NEXT_PUBLIC_RAZORPAY_KEY,{'\n'}
                {'}'});{'\n\n'}
                <span className="text-[#ff92c0]">export function</span>{' '}
                <span className="text-[#7fc8ff]">PayButton</span>() {'{'}{'\n'}
                {'  '}<span className="text-[#ff92c0]">const</span>{' '}
                {'{'} open, isReady {'}'} ={' '}
                <span className="text-[#7fc8ff]">useCheckout</span>(adapter);
                {'\n'}
                {'  '}<span className="text-[#ff92c0]">return</span>{' '}
                <span className="text-muted">{'<'}</span>
                <span className="text-[#c3f26b]">button</span>{' '}
                <span className="text-[#7fc8ff]">onClick</span>={'{'}pay{'}'}
                <span className="text-muted">{'>'}</span>Pay
                <span className="text-muted">{'</'}</span>
                <span className="text-[#c3f26b]">button</span>
                <span className="text-muted">{'>'}</span>;{'\n'}
                {'}'}
              </code>
            </pre>
          }
        />

        <Step
          n="03"
          eyebrow="Server"
          body={
            <pre className="overflow-x-auto border border-line bg-code p-5 font-mono text-[11.75px] leading-[1.7]">
              <code>
                <span className="text-subtle">// app/api/checkout/route.ts</span>
                {'\n'}
                <span className="text-[#ff92c0]">import</span>{' '}
                <span className="text-muted">{'{'}</span>{' '}
                <span className="text-lime">razorpayServer</span>{' '}
                <span className="text-muted">{'}'}</span>{' '}
                <span className="text-[#ff92c0]">from</span>{' '}
                <span className="text-[#e8e28b]">
                  &apos;payment-universal/razorpay/server&apos;
                </span>
                ;{'\n\n'}
                <span className="text-[#ff92c0]">const</span> server ={' '}
                <span className="text-lime">razorpayServer</span>({'{'}
                {'\n'}
                {'  '}keyId<span className="text-muted">:</span> env
                <span className="text-muted">.</span>RAZORPAY_KEY_ID,{'\n'}
                {'  '}keySecret<span className="text-muted">:</span> env
                <span className="text-muted">.</span>RAZORPAY_KEY_SECRET,{'\n'}
                {'}'});{'\n\n'}
                <span className="text-[#ff92c0]">export async function</span>{' '}
                <span className="text-[#7fc8ff]">POST</span>() {'{'}{'\n'}
                {'  '}<span className="text-[#ff92c0]">const</span> order ={' '}
                <span className="text-[#ff92c0]">await</span>{' '}
                server.<span className="text-[#7fc8ff]">createOrder</span>(
                {'{'}{'\n'}
                {'    '}amount<span className="text-muted">:</span> 49900,
                {'\n'}
                {'    '}currency<span className="text-muted">:</span>{' '}
                <span className="text-[#e8e28b]">&apos;INR&apos;</span>,{'\n'}
                {'  '}{'}'});{'\n'}
                {'  '}<span className="text-[#ff92c0]">return</span>{' '}
                Response.<span className="text-[#7fc8ff]">json</span>(order);
                {'\n'}
                {'}'}
              </code>
            </pre>
          }
        />
      </div>
    </section>
  );
}

function Step({
  n,
  eyebrow,
  body,
}: {
  n: string;
  eyebrow: string;
  body: React.ReactNode;
}): JSX.Element {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`flex flex-col gap-5 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <div className="flex items-baseline gap-4">
          <span className="font-serif text-[30px] italic text-lime">{n}</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted">
            {eyebrow}
          </span>
        </div>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-subtle">
          step
        </span>
      </div>
      {body}
    </div>
  );
}

function MiniLine({ label, cmd }: { label: string; cmd: string }): JSX.Element {
  return (
    <div className="flex items-center gap-3 border border-line bg-code px-3 py-2">
      <span className="w-[120px] shrink-0 text-[9.5px] uppercase tracking-[0.24em] text-subtle">
        {label}
      </span>
      <span className="truncate font-mono text-fg/85">{cmd}</span>
    </div>
  );
}
