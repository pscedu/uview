# $Id$

package UView;

use XML::Simple;
use JSON;

sub uview {
	my $s = shift;
	$s->return_die_message(1);
	my $data = `qstat -fx`;
#	print STDERR "data: $data\n";
	return XMLin($data);
}

1;
