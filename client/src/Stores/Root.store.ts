import { ChildStore } from './Core/ChildStore';
import { AssignmentStore } from './Assignment.store';
import { UsersStore } from './Users.store';
import { AssignmentLinksStore } from './AssignmentLinks.store';
import { MicrosoftLearnStore } from './MicrosoftLearn.store';
import { PlatformStore } from './Platform.store';
import { MicrosoftLearnFilterStore } from './MicrosoftLearnFilter.store';

export class RootStore {
  assignmentStore = new AssignmentStore();
  usersStore = new UsersStore();
  assignmentLinksStore = new AssignmentLinksStore();
  microsoftLearnStore = new MicrosoftLearnStore();
  platformStore = new PlatformStore();
  microsoftLearnFilterStore = new MicrosoftLearnFilterStore();

  constructor() {
    const childStores: ChildStore[] = Object.keys(this)
      .map(key => Reflect.get(this, key))
      .filter(value => value instanceof ChildStore);

    childStores.forEach(store => store.setRootStore(this));
    childStores.forEach(store => store.initialize());
  }
}
