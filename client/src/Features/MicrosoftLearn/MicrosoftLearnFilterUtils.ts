/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

import { Product, Catalog, LearnType } from '../../Models/Learn';
import { FilterType } from '../../Models/Learn/FilterType.model';
import { LearnTypeFilterOption, FilterOption } from './MicrosoftLearnFilterComponentProps';
import _ from 'lodash';
import { getParentProduct, scoreRegex } from './MicrosoftLearnFilterCore';
import { Filter } from '../../Models/Learn/Filter.model';
import { toMap } from '../../Core/Utils/Typescript/ToMap';

export const TYPE_MAP = new Map<LearnType, LearnTypeFilterOption>([
  ['module', { id: 'module', name: 'Module' }],
  ['learningPath', { id: 'learningPath', name: 'Learning Path' }]
]);

const SortByFilterNameAscComparer = (a: FilterOption, b: FilterOption): number => {
  if (a && b) {
    return a.name.localeCompare(b.name);
  } else if (a) {
    return 1;
  }
  return -1;
};

const createOptionsMapFromKeys = (keys: FilterOption[]): Map<FilterOption, FilterOption[]> => {
  const valueTransformer = (_item: FilterOption): FilterOption[] => [];
  const keySelector = (item: FilterOption): FilterOption => item;
  return toMap(keys, keySelector, valueTransformer);
};

export const getProductsToDisplay = (
  productId: string[] | undefined,
  productMap: Map<string, Product> | undefined
): Map<Product, Product[]> => {
  let products: Product[] = [];
  const productParentChildMap = new Map<Product, Product[]>();

  if (productMap != null) {
    products = [...productMap.values()].filter(product => productId?.includes(product.id));
    const getParentProductMapping = getParentProduct(productMap);
    const parentProducts = products
      .filter(item => getParentProductMapping(item.id) === '')
      .sort(SortByFilterNameAscComparer);
    parentProducts.forEach(parent => {
      const children = products.filter(
        product => product?.parentId && product.parentId === parent?.id && product.id !== parent.id
      );
      productParentChildMap.set(parent, children.sort(SortByFilterNameAscComparer));
    });
  }
  return productParentChildMap;
};

export function getFilterItemsToDisplay<T extends FilterOption>(
  ids: string[] | undefined,
  map: Map<string, T> | undefined
): Map<FilterOption, FilterOption[]> {
  if (map != null) {
    const sortedItems = ids?.map(id => map.get(id)!!).sort(SortByFilterNameAscComparer);
    return createOptionsMapFromKeys(sortedItems || []);
  }
  return new Map<T, T[]>();
}

export type FilterTag = { id: string; name: string; type: FilterType };

export const getDisplayFilterTags = (
  displayFilters: Filter,
  selectedFilters: Filter,
  productsMap: Map<string, Product>,
  learnCatalog: Catalog | null
): FilterTag[] => {
  const getIntersection = (type: FilterType): string[] => {
    const intersect = displayFilters[type].filter(item => selectedFilters[type]?.includes(item));
    if (type === FilterType.products) {
      intersect.map(productItem => productsMap.get(productItem)).filter(productItem => productItem?.parentId);

      const getParentProductMapping = getParentProduct(productsMap);
      const parentTags = intersect.filter(item => getParentProductMapping(item) === '');
      const childTags = intersect.filter(item => !parentTags.includes(getParentProductMapping(item)));
      return [...parentTags, ...childTags];
    }
    return intersect;
  };

  const getTags = (_map: Map<string, FilterOption> | undefined, _type: FilterType): FilterTag[] => {
    let _tags: FilterTag[] = [];
    const _filters = getIntersection(_type);
    if (_map?.values()) {
      _tags = [..._map.values()]
        .filter(item => _filters?.includes(item.id))
        .map(item => ({ id: item.id, name: item.name, type: _type }));
    }
    return _tags;
  };

  const productTags: FilterTag[] = getTags(learnCatalog?.products, FilterType.products);
  const roleTags: FilterTag[] = getTags(learnCatalog?.roles, FilterType.roles);
  const levelTags: FilterTag[] = getTags(learnCatalog?.levels, FilterType.levels);
  const typeTags: FilterTag[] = getTags(TYPE_MAP, FilterType.types);

  return [...productTags, ...roleTags, ...levelTags, ...typeTags];
};

export const getDisplayFromSearch = (
  expressions: RegExp[],
  currentDisplay: Map<FilterOption, FilterOption[]>
): Map<FilterOption, FilterOption[]> => {
  const filteredDisplay: Map<FilterOption, FilterOption[]> = new Map<FilterOption, FilterOption[]>();
  [...currentDisplay.keys()].forEach(key => {
    const children = currentDisplay.get(key);
    let filteredByRegEx: FilterOption[] = [];
    if (children && children.length > 0) {
      filteredByRegEx = children
        .map(chlid => ({
          item: chlid,
          score: _.sumBy(expressions, singleExpression => scoreRegex(chlid?.name, singleExpression))
        }))
        .filter(chlid => chlid.score > 0)
        .map(chlid => chlid.item);
      if (filteredByRegEx?.length && filteredByRegEx.length > 0) {
        filteredDisplay.set(key, filteredByRegEx);
      }
    } else {
      filteredByRegEx = [
        {
          item: key,
          score: _.sumBy(expressions, singleExpression => scoreRegex(key?.name, singleExpression))
        }
      ]
        .filter(element => element.score > 0)
        .map(element => element.item);
      if (filteredByRegEx.length > 0) {
        filteredDisplay.set(key, []);
      }
    }
  });
  return filteredDisplay;
};
