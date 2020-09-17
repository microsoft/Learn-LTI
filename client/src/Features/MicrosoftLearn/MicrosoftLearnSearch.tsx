/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { IThemeOnlyProps, SimpleComponentStyles, IStylesOnly } from '../../Core/Utils/FluentUI/typings.fluent-ui';
import { styled, SearchBox, Label } from '@fluentui/react';
import { themedClassNames } from '../../Core/Utils/FluentUI';
import { inputLabelStyle } from '../../Core/Components/Common/Inputs/EdnaInputStyles';
import { useStore } from '../../Stores/Core';
import { useObserver } from 'mobx-react-lite';

export type MicrosoftLearnSearchStyles = SimpleComponentStyles<'root' | 'label' | 'searchBox'>;

const MicrosoftLearnSearchInner = ({ styles }: IStylesOnly<MicrosoftLearnSearchStyles>): JSX.Element => {
  const learnStore = useStore('microsoftLearnStore');

  const classes = themedClassNames(styles);
  return useObserver(() => {
    return (
      <div className={classes.root}>
        <Label className={classes.label}>Search</Label>
        <SearchBox
          onChange={(_e, newValue) => learnStore.updateSearchTerm(newValue || '')}
          className={classes.searchBox}
          disabled={!!learnStore.isLoadingCatalog}
        />
      </div>
    );
  });
};

const microsoftLearnSearchStyles = ({ theme }: IThemeOnlyProps): MicrosoftLearnSearchStyles => ({
  root: [
    {
      paddingRight: theme.spacing.s1,
      display: 'flex',
      alignItems: 'center'
    }
  ],
  label: [inputLabelStyle({ theme })],
  searchBox: [
    {
      width: '100%',
      marginLeft: `calc(${theme.spacing.l2}*2)`
    }
  ]
});

export const MicrosoftLearnSearch = styled(MicrosoftLearnSearchInner, microsoftLearnSearchStyles);
