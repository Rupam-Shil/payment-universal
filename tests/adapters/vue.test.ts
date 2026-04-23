import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useCheckout } from '../../src/adapters/vue/useCheckout';
import { makeFakeBrowserAdapter } from '../test-utils/fakeAdapter';
import type { NormalizedOrder } from '../../src/core';

const ORDER: NormalizedOrder = {
  id: 'order_1',
  amount: 100,
  currency: 'INR',
  status: 'created',
  gateway: 'razorpay',
  clientPayload: {},
  raw: {},
};

function makeHarness(adapter: ReturnType<typeof makeFakeBrowserAdapter>): {
  vm: ReturnType<typeof useCheckout>;
  wrapper: ReturnType<typeof mount>;
} {
  let vm!: ReturnType<typeof useCheckout>;
  const Comp = defineComponent({
    setup() {
      vm = useCheckout(adapter);
      return () => h('div');
    },
  });
  const wrapper = mount(Comp);
  return { vm, wrapper };
}

describe('useCheckout (Vue)', () => {
  it('transitions to ready after adapter.load resolves', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { vm, wrapper } = makeHarness(adapter);

    expect(vm.isLoading.value).toBe(true);
    await nextTick();
    await Promise.resolve();
    // wait a tick for the load microtask
    for (let i = 0; i < 5 && !vm.isReady.value; i += 1) {
      await nextTick();
    }
    expect(vm.isReady.value).toBe(true);
    expect(vm.isLoading.value).toBe(false);
    wrapper.unmount();
  });

  it('open() delegates to adapter.openCheckout', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { vm, wrapper } = makeHarness(adapter);
    for (let i = 0; i < 5 && !vm.isReady.value; i += 1) {
      await nextTick();
    }
    const payment = await vm.open({ order: ORDER, mode: 'modal' });
    expect(payment.status).toBe('success');
    expect(adapter.opened).toHaveLength(1);
    wrapper.unmount();
  });

  it('surfaces load errors into error.value', async () => {
    const adapter = makeFakeBrowserAdapter();
    adapter.load = () => Promise.reject(new Error('bad script'));
    const { vm, wrapper } = makeHarness(adapter);
    for (let i = 0; i < 5 && !vm.error.value; i += 1) {
      await nextTick();
    }
    expect(vm.error.value?.message).toBe('bad script');
    expect(vm.isReady.value).toBe(false);
    wrapper.unmount();
  });
});
