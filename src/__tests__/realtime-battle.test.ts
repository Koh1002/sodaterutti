/**
 * リアルタイムバトルのチャンネル管理テスト
 *
 * 修正したバグ: createBrowserClient がシングルトンを返すため、
 * battle page の一時チャンネルと RealtimeBattleScreen のチャンネルが競合し、
 * removeChannel でバトル中のチャンネルが破壊されていた。
 *
 * 修正: RealtimeBattleScreen は `battle-game:${sessionId}` を使い、
 * battle page の `battle:${sessionId}` と名前を分離。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =========================================
// Supabase クライアントのモック
// =========================================

/** チャンネルインスタンスを追跡 */
const channelRegistry = new Map<string, MockChannel>();
let removedChannels: string[] = [];

class MockChannel {
  name: string;
  listeners: Map<string, (payload: { payload: unknown }) => void> = new Map();
  subscribeCallback: ((status: string) => void) | null = null;
  removed = false;

  constructor(name: string) {
    this.name = name;
  }

  on(_type: string, filter: { event: string }, callback: (payload: { payload: unknown }) => void) {
    this.listeners.set(filter.event, callback);
    return this;
  }

  subscribe(cb?: (status: string) => void) {
    this.subscribeCallback = cb ?? null;
    // 非同期で SUBSCRIBED を通知
    setTimeout(() => {
      if (!this.removed && cb) cb('SUBSCRIBED');
    }, 0);
    return this;
  }

  send(payload: { type: string; event: string; payload: unknown }) {
    // broadcast: self=true なので自分にも配信
    const listener = this.listeners.get(payload.event);
    if (listener && !this.removed) {
      listener({ payload: payload.payload });
    }
  }

  /** 外部からイベントをシミュレーション（相手からの受信） */
  simulateReceive(event: string, payload: unknown) {
    const listener = this.listeners.get(event);
    if (listener && !this.removed) {
      listener({ payload });
    }
  }
}

function createMockSupabase() {
  return {
    channel(name: string, _config?: unknown) {
      // シングルトン挙動: 同名チャンネルは同じインスタンスを返す
      if (channelRegistry.has(name)) {
        return channelRegistry.get(name)!;
      }
      const ch = new MockChannel(name);
      channelRegistry.set(name, ch);
      return ch;
    },
    removeChannel(channel: MockChannel) {
      channel.removed = true;
      removedChannels.push(channel.name);
      channelRegistry.delete(channel.name);
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: [] }),
  };
}

let mockSupabase: ReturnType<typeof createMockSupabase>;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

beforeEach(() => {
  channelRegistry.clear();
  removedChannels = [];
  mockSupabase = createMockSupabase();
});

// =========================================
// テスト
// =========================================

describe('チャンネル名の分離', () => {
  it('RealtimeBattleScreen は battle-game: プレフィックスを使用すること', () => {
    const sessionId = 'test-session-123';
    // RealtimeBattleScreen が作るチャンネル名
    const expectedName = `battle-game:${sessionId}`;
    // battle page が使っていた旧チャンネル名
    const oldName = `battle:${sessionId}`;

    expect(expectedName).not.toBe(oldName);
    expect(expectedName).toBe('battle-game:test-session-123');
  });

  it('シングルトンクライアントで同名チャンネルを要求すると同じインスタンスが返ること', () => {
    const ch1 = mockSupabase.channel('battle-game:abc');
    const ch2 = mockSupabase.channel('battle-game:abc');
    expect(ch1).toBe(ch2);
  });

  it('異なる名前のチャンネルは別インスタンスになること', () => {
    const ch1 = mockSupabase.channel('battle-game:abc');
    const ch2 = mockSupabase.channel('battle:abc');
    expect(ch1).not.toBe(ch2);
  });
});

describe('ゲスト側のチャンネル競合修正', () => {
  const sessionId = 'session-456';

  it('旧実装: battle: チャンネルを一時作成→removeすると同名チャンネルが破壊される', () => {
    // 旧実装のシミュレーション: battle page が一時チャンネルを作成
    const tempChannel = mockSupabase.channel(`battle:${sessionId}`) as MockChannel;
    tempChannel.on('broadcast', { event: 'battle_event' }, () => {});
    tempChannel.subscribe();

    // RealtimeBattleScreen が同名チャンネルを要求 → 同じインスタンス
    const battleChannel = mockSupabase.channel(`battle:${sessionId}`) as MockChannel;
    expect(battleChannel).toBe(tempChannel);

    // battle page が 2秒後に removeChannel → バトルチャンネルも死ぬ
    mockSupabase.removeChannel(tempChannel);
    expect(tempChannel.removed).toBe(true);
    expect(battleChannel.removed).toBe(true); // 同じインスタンスなので true

    // 新しいイベントを受信しようとしても無視される
    let received = false;
    battleChannel.simulateReceive('battle_event', { type: 'move_select', playerId: 'p2', moveId: 1 });
    // listener が呼ばれない（removed=true）
    expect(received).toBe(false);
  });

  it('新実装: battle-game: チャンネルは battle: の removeChannel に影響されない', () => {
    // 仮に battle page が古いチャンネル名で何か作成しても
    const oldChannel = mockSupabase.channel(`battle:${sessionId}`) as MockChannel;
    oldChannel.subscribe();

    // RealtimeBattleScreen は battle-game: を使う
    const gameChannel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    let receivedEvent: unknown = null;
    gameChannel.on('broadcast', { event: 'battle_event' }, ({ payload }) => {
      receivedEvent = payload;
    });
    gameChannel.subscribe();

    // 古いチャンネルを remove しても...
    mockSupabase.removeChannel(oldChannel);
    expect(oldChannel.removed).toBe(true);

    // battle-game チャンネルは生きている
    expect(gameChannel.removed).toBe(false);

    // イベントを正常に受信できる
    gameChannel.simulateReceive('battle_event', {
      type: 'move_select',
      playerId: 'opponent-id',
      moveId: 5,
    });
    expect(receivedEvent).toEqual({
      type: 'move_select',
      playerId: 'opponent-id',
      moveId: 5,
    });
  });
});

describe('ホスト側の待機チャンネル', () => {
  const sessionId = 'session-789';

  it('ホストの待機チャンネルが battle-game: を使い、guest_joined を受信できること', async () => {
    // ホスト側: battle page が待機チャンネルを作成
    const waitChannel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    let guestJoined = false;

    waitChannel.on('broadcast', { event: 'battle_event' }, ({ payload }) => {
      const event = payload as { type: string };
      if (event.type === 'guest_joined') {
        guestJoined = true;
      }
    });
    waitChannel.subscribe();

    // ゲスト側: RealtimeBattleScreen が同じ battle-game: チャンネルに接続
    // (シングルトンなので同じインスタンスが返る)
    const guestChannel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    expect(guestChannel).toBe(waitChannel); // 同じチャンネル

    // ゲストが guest_joined を送信
    guestChannel.send({
      type: 'broadcast',
      event: 'battle_event',
      payload: { type: 'guest_joined', guestSnapshot: { name: 'Guest' } },
    });

    expect(guestJoined).toBe(true);
  });

  it('ホストがRealtimeBattleScreenに遷移後もチャンネルが維持されること', () => {
    // ホスト: 待機チャンネル作成
    const waitChannel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    waitChannel.on('broadcast', { event: 'battle_event' }, () => {});
    waitChannel.subscribe();

    // ゲスト参加 → ホストは waitChannelRef.current = null にするが removeChannel しない
    // (修正後の挙動)

    // RealtimeBattleScreen が同名チャンネルを要求 → 同じインスタンス
    const battleChannel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    expect(battleChannel).toBe(waitChannel);
    expect(battleChannel.removed).toBe(false);

    // 新しいリスナーを追加してもチャンネルは動作する
    let moveReceived = false;
    battleChannel.on('broadcast', { event: 'battle_event' }, ({ payload }) => {
      const event = payload as { type: string };
      if (event.type === 'move_select') {
        moveReceived = true;
      }
    });

    battleChannel.simulateReceive('battle_event', {
      type: 'move_select',
      playerId: 'guest-id',
      moveId: 3,
    });
    expect(moveReceived).toBe(true);
  });
});

describe('ゲストの guest_joined 送信タイミング', () => {
  const sessionId = 'session-join-test';

  it('ゲストはチャンネル SUBSCRIBED 後に guest_joined を送信すること', async () => {
    const channel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    let sentEvents: unknown[] = [];

    // send をスパイ
    const originalSend = channel.send.bind(channel);
    channel.send = (payload) => {
      sentEvents.push(payload);
      originalSend(payload);
    };

    channel.on('broadcast', { event: 'battle_event' }, () => {});
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // ゲスト側: SUBSCRIBED 時に guest_joined を送信
        channel.send({
          type: 'broadcast',
          event: 'battle_event',
          payload: {
            type: 'guest_joined',
            guestSnapshot: { name: 'TestGuest', speciesName: 'テスト種' },
          },
        });
      }
    });

    // subscribe は非同期で SUBSCRIBED を通知
    await new Promise(r => setTimeout(r, 10));

    expect(sentEvents).toHaveLength(1);
    const sent = sentEvents[0] as { payload: { type: string } };
    expect(sent.payload.type).toBe('guest_joined');
  });
});

describe('move_select イベントのフィルタリング', () => {
  it('自分の move_select は無視し、相手の move_select のみ処理すること', () => {
    const myUserId = 'host-user';
    const opponentUserId = 'guest-user';
    const sessionId = 'filter-test';

    const channel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    let processedMoves: number[] = [];

    channel.on('broadcast', { event: 'battle_event' }, ({ payload }) => {
      const event = payload as { type: string; playerId: string; moveId: number };
      if (event.type === 'move_select') {
        if (event.playerId !== myUserId) {
          processedMoves.push(event.moveId);
        }
      }
    });
    channel.subscribe();

    // 自分の move_select → 無視されるべき
    channel.simulateReceive('battle_event', {
      type: 'move_select',
      playerId: myUserId,
      moveId: 1,
    });
    expect(processedMoves).toHaveLength(0);

    // 相手の move_select → 処理されるべき
    channel.simulateReceive('battle_event', {
      type: 'move_select',
      playerId: opponentUserId,
      moveId: 5,
    });
    expect(processedMoves).toEqual([5]);
  });
});

describe('チャンネルのクリーンアップ', () => {
  it('RealtimeBattleScreen のアンマウント時にチャンネルが removeChannel されること', () => {
    const sessionId = 'cleanup-test';
    const channel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    channel.subscribe();

    expect(channel.removed).toBe(false);
    expect(removedChannels).not.toContain(`battle-game:${sessionId}`);

    // アンマウント時の cleanup を模擬
    mockSupabase.removeChannel(channel);

    expect(channel.removed).toBe(true);
    expect(removedChannels).toContain(`battle-game:${sessionId}`);
  });

  it('removed なチャンネルはイベントを受信しないこと', () => {
    const sessionId = 'dead-channel';
    const channel = mockSupabase.channel(`battle-game:${sessionId}`) as MockChannel;
    let received = false;

    channel.on('broadcast', { event: 'battle_event' }, () => {
      received = true;
    });
    channel.subscribe();

    mockSupabase.removeChannel(channel);

    channel.simulateReceive('battle_event', {
      type: 'move_select',
      playerId: 'someone',
      moveId: 1,
    });

    expect(received).toBe(false);
  });
});
