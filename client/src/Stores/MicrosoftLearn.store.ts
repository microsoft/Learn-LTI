import { ChildStore } from './Core';
import { observable, action } from 'mobx';
import { Catalog, Product } from '../Models/Learn';
import { MicrosoftLearnService } from '../Services/MicrosoftLearn.service';
import { CatalogDto, ProductChildDto, ProductDto } from '../Dtos/Learn';
import { toMap } from '../Core/Utils/Typescript/ToMap';
import { map, filter, switchMap } from 'rxjs/operators';
import { toObservable } from '../Core/Utils/Mobx/toObservable';
import { AssignmentLearnContent } from '../Models/Learn/AssignmentLearnContent';
import { AssignmentLearnContentDto } from '../Dtos/Learn/AssignmentLearnContent.dto';

export class MicrosoftLearnStore extends ChildStore {
  @observable isLoadingCatalog: boolean | null = null;
  @observable catalog: Catalog | null = null;
  @observable selectedItems: AssignmentLearnContent[] | null = null;
  
  initialize(): void {
    toObservable(() => this.root.assignmentStore.assignment)
      .pipe(
        filter(assignment => !!assignment),
        map(assignment => assignment!.id),
        switchMap(assignmentId => MicrosoftLearnService.getAssignmentLearnContent(assignmentId)),
        filter(assignmentLearnContent => !assignmentLearnContent.error),
        map(assignmentLearnContent => assignmentLearnContent as AssignmentLearnContentDto[])
      )
      .subscribe(selectedItems => (this.selectedItems = selectedItems));         
  }

  @action
  removeItemSelection(learnContentUid: string): void {
    const assignmentId = this.root.assignmentStore.assignment!.id;
    const itemIndexInSelectedItemsList = this.getItemIndexInSelectedList(learnContentUid);
    if (itemIndexInSelectedItemsList == null) {
      return;
    }
    this.applyRemoveItemSelection(itemIndexInSelectedItemsList, assignmentId, learnContentUid);
  }

  @action
  toggleItemSelection(learnContentUid: string): void {
    const assignmentId = this.root.assignmentStore.assignment!.id;
    const itemIndexInSelectedItemsList = this.getItemIndexInSelectedList(learnContentUid);
    if (itemIndexInSelectedItemsList == null) {
      return;
    }
    if (itemIndexInSelectedItemsList > -1) {
      this.applyRemoveItemSelection(itemIndexInSelectedItemsList, assignmentId, learnContentUid);
    } else {
      this.selectedItems?.push({ contentUid: learnContentUid });
      MicrosoftLearnService.saveAssignmentLearnContent(assignmentId, learnContentUid);
    }
  }

  @action
  clearAssignmentLearnContent(): void {
    this.selectedItems = [];
    const assignmentId = this.root.assignmentStore.assignment!.id;
    MicrosoftLearnService.clearAssignmentLearnContent(assignmentId);
  }

  @action
  async initializeCatalog(): Promise<void> {
    this.isLoadingCatalog = true;
    const catalog = await MicrosoftLearnService.getCatalog();
    if (catalog.error) {
      // Will show the error on the message bar once it's implemented
      return;
    }

    const { modules, learningPaths } = catalog;
    const products = this.getProducts(catalog);
    const roles = toMap(catalog.roles, item => item.id);
    const levels = toMap(catalog.levels, item => item.id);
    const allItems = [...modules, ...learningPaths];
    const items = toMap(allItems, item => item.uid);
    this.catalog = { contents: items, products, roles, levels };
    this.isLoadingCatalog = false;
  }

  private getItemIndexInSelectedList = (learnContentUid: string): number | void => {
    return this.selectedItems?.findIndex(item => item.contentUid === learnContentUid);
  };

  private applyRemoveItemSelection = (
    itemIndexInSelectedItemsList: number,
    assignmentId: string,
    learnContentUid: string
  ): void => {
    this.selectedItems?.splice(itemIndexInSelectedItemsList, 1);
    MicrosoftLearnService.removeAssignmentLearnContent(assignmentId, learnContentUid);
  };

  private getProducts = (catalog: CatalogDto): Map<string, Product> => {
    const productsMap = new Map<string, Product>();
    const setItemInCatalog = (item: ProductChildDto | ProductDto, parent?: ProductDto): void => {
      productsMap.set(item.id, {
        id: item.id,
        parentId: parent?.id || null,
        name: item.name
      });
    };

    catalog.products.forEach(product => {
      setItemInCatalog(product);
      product.children?.forEach(productChild => setItemInCatalog(productChild, product));
    });

    return productsMap;
  };

}