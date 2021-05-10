/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { SimpleComponentStyles, IStylesOnly, IThemeOnlyProps } from '../../Core/Utils/FluentUI/typings.fluent-ui';
import moment from 'moment';
import { styled, mergeStyleSets, Text } from '@fluentui/react';
import { themedClassNames } from '../../Core/Utils/FluentUI';
import { StudentViewSection, StudentViewSectionStyles, StudentViewSectionProps } from './StudentViewSection';
import { useStore } from '../../Stores/Core';
import { AssignmentLinksList } from '../AssignmentLinks/AssignmentLinksList';
import { useObserver } from 'mobx-react-lite';
import _ from 'lodash';
import { StudentViewLearnItemsList } from './StudentViewLearnItemsList';

interface StudentViewContentProps {
  requirePublished?: boolean;
}

type StudentViewContentStyles = SimpleComponentStyles<'root'>;

const formatDate = (assignmentDate?: Date): string => {
  return assignmentDate ? moment(assignmentDate).format('MMMM DD YYYY') : '';
};

const StudentViewContentInner = ({
  styles,
  requirePublished
}: StudentViewContentProps & IStylesOnly<StudentViewContentStyles>): JSX.Element => {
  const classes = themedClassNames(styles);

  const assignmentStore = useStore('assignmentStore');
  const assignmentLinksStore = useStore('assignmentLinksStore');
  const learnStore = useStore('microsoftLearnStore');

  return useObserver(() => {
    const items: (StudentViewSectionProps & IStylesOnly<StudentViewSectionStyles>)[] = _.compact([
      assignmentStore.assignment?.description && {
        title: 'Description',
        textContent: assignmentStore.assignment.description.substring(0, 2500)
      },
      assignmentStore.assignment?.deadline && {
        title: 'Deadline',
        textContent: formatDate(assignmentStore.assignment.deadline)
      },
      (assignmentLinksStore.isLoading || assignmentLinksStore.assignmentLinks.length > 0) && {
        title: 'Links',
        styles: linksSectionStyles,
        content: <AssignmentLinksList disableEdit />,
        alertMessage: assignmentLinksStore.areSomeLinksInvalid
          ? 'Some links were ill-formed, and therefore, were not rendered. Please contact the administrator or the teacher.'
          : ''
      },
      learnStore.selectedItems &&
        learnStore.selectedItems.length > 0 && {
          title: 'Tutorials',
          content: <StudentViewLearnItemsList />
        }
    ]);

    return (
      <div className={classes.root}>
        {' '}
        {requirePublished && assignmentStore.assignment?.publishStatus !== 'Published' ? (
          <Text>This assignment is not yet Published</Text>
        ) : items.length === 0 ? (
          <Text>No info was entered for this assignment</Text>
        ) : (
          items.map(item => {
            const itemSpecificStyles = themedClassNames(item.styles);
            const baseStyles = themedClassNames(baseSectionStyles);
            const styles = mergeStyleSets(baseStyles, itemSpecificStyles);
            return <StudentViewSection key={item.title} {...item} styles={styles} />;
          })
        )}{' '}
      </div>
    );
  });
};

const studentViewContentStyles = (_theme: IThemeOnlyProps): StudentViewContentStyles => ({
  root: [{}]
});

const linksSectionStyles = (): Partial<StudentViewSectionStyles> => ({
  root: [
    {
      paddingBottom: 0
    }
  ],
  title: [
    {
      marginBottom: 0
    }
  ]
});

const baseSectionStyles = ({ theme }: IThemeOnlyProps): Partial<StudentViewSectionStyles> => ({
  root: [
    {
      borderColor: theme.semanticColors.bodyDivider,
      paddingBottom: `calc(${theme.spacing.l1} + ${theme.spacing.s2})`,
      paddingTop: `calc(${theme.spacing.l1} + ${theme.spacing.s2})`,
      borderBottomStyle: 'solid',
      borderBottomWidth: 1,
      selectors: {
        '&:first-child': {
          paddingTop: 0
        },
        '&:last-child': {
          paddingBottom: 0,
          borderBottomWidth: 0
        }
      }
    }
  ]
});

export const StudentViewContent = styled(StudentViewContentInner, studentViewContentStyles);
