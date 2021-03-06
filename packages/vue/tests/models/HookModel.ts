import { Model } from '../../src';
import { $api } from '../libs/ApiService';

interface Data {
  count: number;
}

export class HookModel  extends Model<Data> {
  increase = this.action((state) => {
    state.count += 1;
  });

  fetch = $api.action(() => {
    return this.get<Data>('/');
  });

  multipleFetch = $api.action((id: number) => {
    return this.get('/').metas(id);
  });

  mixFetch = this.compose(async (id: number) => {
    const { response } = await this.fetch();
    await this.multipleFetch(id);

    this.changeReducer((state) => {
      state.count = response.count;
    });
  });

  protected initReducer(): Data {
    return {
      count: 0,
    };
  }
}
