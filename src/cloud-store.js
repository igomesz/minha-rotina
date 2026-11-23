import {empty,validate} from './model.js';
// The database performs an atomic compare-and-swap. A stale browser never
// overwrites a newer version saved by another device.
export function createCloudStore(client,userId){
 return {
  async read(){const {data,error}=await client.from('routine_state').select('payload,revision').eq('user_id',userId).maybeSingle();if(error)throw error;return data?{payload:validate(data.payload),revision:Number(data.revision)}:{payload:empty(),revision:0};},
  async write(payload,revision){validate(payload);const {data,error}=await client.rpc('save_my_routine',{p_payload:payload,p_expected_revision:revision});if(error)throw error;return {payload:validate(data.payload),revision:Number(data.revision)};}
 };
}
export function storageError(error){if(error?.code==='40001')return 'Sua rotina mudou em outro dispositivo. Atualizamos os dados; repita esta alteração.';if(error?.code==='42501'||error?.status===401)return 'Sua sessão expirou ou não tem permissão. Entre novamente.';return 'Não foi possível salvar na nuvem. A alteração não foi confirmada. Confira sua conexão e tente novamente.';}
